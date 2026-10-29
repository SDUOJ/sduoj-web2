const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const { create, verify, permitted } = require('./release-artifact.cjs');

const metadata = {
  sourceRef: 'a'.repeat(40),
  publicPath: '/v2/',
  version: '0.1.0',
  createdAt: '2026-10-04T00:00:00.000Z',
  releaseId: 'audit-fixture',
  deployment: {
    environment: 'production',
    apiOrigin: 'https://oj.qd.sdu.edu.cn',
    frontOrigin: 'https://oj.qd.sdu.edu.cn',
    socketOrigin: 'wss://oj.qd.sdu.edu.cn',
  },
};
const vditorRuntime = 'window.Vditor={};';
const vditorChecksum = crypto.createHash('sha256').update(vditorRuntime).digest('hex');
const vditorRevision = crypto
  .createHash('sha256')
  .update(`index.min.js\0${vditorChecksum}\n`)
  .digest('hex');

function fixture(context, prefix = '/v2/') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-artifact-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'static/js'), { recursive: true });
  fs.mkdirSync(path.join(directory, `vditor/${vditorRevision}/dist`), { recursive: true });
  const entrypoints = ['static/js/runtime-main.123abc.js', 'static/js/main.456def.js'];
  for (const filename of entrypoints)
    fs.writeFileSync(path.join(directory, filename), 'window.fixture=true;');
  fs.writeFileSync(
    path.join(directory, `vditor/${vditorRevision}/dist/index.min.js`),
    vditorRuntime,
  );
  fs.writeFileSync(
    path.join(directory, 'index.html'),
    `<meta name="sduoj-environment" content="${encodeURIComponent(JSON.stringify(metadata.deployment))}"><div id="root"></div>${entrypoints.map((entry) => `<script src="${prefix}${entry}"></script>`).join('')}`,
  );
  fs.writeFileSync(
    path.join(directory, 'asset-manifest.json'),
    JSON.stringify({
      files: Object.fromEntries(entrypoints.map((entry) => [entry, prefix + entry])),
      entrypoints,
    }),
  );
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify({ start_url: prefix + 'home' }),
  );
  return directory;
}

test('creates and verifies a complete, versioned artifact for each deployment prefix', (context) => {
  for (const publicPath of ['/v2/', '/v2-pre/']) {
    const directory = fixture(context, publicPath);
    const report = create(directory, { ...metadata, publicPath });
    assert.equal(report.status, 'verified');
    assert.equal(report.fileCount, 6);
    assert.equal(report.sourceRef, metadata.sourceRef);
    assert.equal(report.publicPath, publicPath);
    assert.match(report.manifestSha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(verify(directory, metadata.sourceRef, publicPath), report);
  }
});

test('rejects content tampering with unchanged length', (context) => {
  const directory = fixture(context);
  create(directory, metadata);
  fs.writeFileSync(path.join(directory, 'static/js/main.456def.js'), 'window.fixture=evil;');
  assert.throws(() => verify(directory, metadata.sourceRef, '/v2/'), /hash mismatch/);
});

test('rejects missing, extra and forbidden files', (context) => {
  const missing = fixture(context);
  create(missing, metadata);
  fs.unlinkSync(path.join(missing, 'static/js/main.456def.js'));
  assert.throws(() => verify(missing, metadata.sourceRef, '/v2/'), /file count mismatch/);
  const extra = fixture(context);
  create(extra, metadata);
  fs.writeFileSync(path.join(extra, 'static/js/extra.js'), 'extra');
  assert.throws(() => verify(extra, metadata.sourceRef, '/v2/'), /file count mismatch/);
  fs.writeFileSync(path.join(extra, '.env'), 'secret');
  assert.throws(() => verify(extra, metadata.sourceRef, '/v2/'), /Path rejected/);
});

test('rejects symlinks, including the manifest and artifact root', (context) => {
  const directory = fixture(context);
  create(directory, metadata);
  fs.symlinkSync('main.456def.js', path.join(directory, 'static/js/linked.js'));
  assert.throws(() => verify(directory, metadata.sourceRef, '/v2/'), /Symlink rejected/);
  fs.unlinkSync(path.join(directory, 'static/js/linked.js'));
  fs.renameSync(path.join(directory, 'release-manifest.json'), path.join(directory, 'saved.json'));
  fs.symlinkSync('saved.json', path.join(directory, 'release-manifest.json'));
  assert.throws(() => verify(directory, metadata.sourceRef, '/v2/'), /regular file/);
  const linked = directory + '-link';
  fs.symlinkSync(directory, linked);
  context.after(() => fs.unlinkSync(linked));
  assert.throws(() => create(linked, metadata), /real directory/);
});

test('rejects the wrong checkout, prefix and invalid metadata', (context) => {
  const directory = fixture(context);
  create(directory, metadata);
  assert.throws(() => verify(directory, 'b'.repeat(40), '/v2/'), /source ref mismatch/);
  assert.throws(() => verify(directory, metadata.sourceRef, '/v2-pre/'), /public path mismatch/);
  assert.throws(() => verify(directory, 'HEAD', '/v2/'), /full Git SHA/);
  assert.throws(() => create(directory, { ...metadata, releaseId: '../bad' }), /release id/);
});

test('rejects duplicate or forged manifest records', (context) => {
  for (const field of ['path', 'size', 'sha256']) {
    const directory = fixture(context);
    create(directory, metadata);
    const filename = path.join(directory, 'release-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
    manifest.files[1][field] = manifest.files[0][field];
    fs.writeFileSync(filename, JSON.stringify(manifest));
    assert.throws(() => verify(directory, metadata.sourceRef, '/v2/'), /mismatch/);
  }
});

test('rejects dangling HTML and asset-map references before writing a manifest', (context) => {
  const directory = fixture(context);
  fs.appendFileSync(
    path.join(directory, 'index.html'),
    '<script src="https://evil.example/x.js"></script>',
  );
  assert.throws(() => create(directory, metadata), /Invalid resource URL/);
  const dangling = fixture(context);
  const filename = path.join(dangling, 'asset-manifest.json');
  const assets = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assets.files.extra = '/v2/static/js/missing.js';
  fs.writeFileSync(filename, JSON.stringify(assets));
  assert.throws(() => create(dangling, metadata), /Referenced resource missing/);
});

test('rejects missing runtime, wrong PWA prefix and oversized payloads', (context) => {
  const directory = fixture(context);
  fs.writeFileSync(
    path.join(directory, 'manifest.json'),
    JSON.stringify({ start_url: '/v2-pre/home' }),
  );
  assert.throws(() => create(directory, metadata), /PWA public path mismatch/);
  const runtime = fixture(context);
  const filename = path.join(runtime, 'asset-manifest.json');
  const assets = JSON.parse(fs.readFileSync(filename, 'utf8'));
  assets.entrypoints = ['static/js/main.456def.js'];
  fs.writeFileSync(filename, JSON.stringify(assets));
  assert.throws(() => create(runtime, metadata), /Missing runtime/);
  const oversized = fixture(context);
  const descriptor = fs.openSync(path.join(oversized, 'static/js/huge.js'), 'w');
  fs.ftruncateSync(descriptor, 40 * 1024 * 1024 + 1);
  fs.closeSync(descriptor);
  assert.throws(() => create(oversized, metadata), /File size limit/);
});

test('path allowlist rejects traversal, hidden files, source maps and executables', () => {
  for (const filename of [
    '../index.html',
    '/index.html',
    'static//js/x.js',
    'static/js/../x.js',
    'static/js/.env',
    'static/js/a.js\n',
    'static\\js\\x.js',
    'static/js/x.map',
    'static/js/x.php',
    'vditor/dist/private.pem',
  ]) {
    assert.equal(permitted(filename), false, filename);
  }
  for (const filename of [
    'index.html',
    'static/js/main.abc.js',
    'static/media/font.woff2',
    `vditor/${vditorRevision}/dist/types/index.d.ts`,
    `vditor/${vditorRevision}/dist/js/mathjax/LICENSE`,
  ]) {
    assert.equal(permitted(filename), true, filename);
  }
});

test('rejects unversioned and falsely named Vditor distributions', (context) => {
  assert.equal(permitted('vditor/dist/index.min.js'), false);
  const directory = fixture(context);
  fs.renameSync(
    path.join(directory, 'vditor', vditorRevision),
    path.join(directory, 'vditor', 'b'.repeat(64)),
  );
  assert.throws(() => create(directory, metadata), /Vditor content revision mismatch/);
});

test('rejects deployment to the wrong host or prefix and test artifact promotion', (context) => {
  const directory = fixture(context);
  create(directory, metadata);
  assert.equal(
    verify(directory, metadata.sourceRef, '/v2/', 'https://oj.qd.sdu.edu.cn/v2/').status,
    'verified',
  );
  assert.throws(
    () => verify(directory, metadata.sourceRef, '/v2/', 'https://staging.example/v2/'),
    /target origin mismatch/,
  );
  assert.throws(
    () => verify(directory, metadata.sourceRef, '/v2/', 'https://oj.qd.sdu.edu.cn/v2-pre/'),
    /target prefix mismatch/,
  );
  const filename = path.join(directory, 'release-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(filename, 'utf8'));
  manifest.deployment = {
    environment: 'test',
    apiOrigin: 'http://127.0.0.1:4173',
    frontOrigin: 'http://127.0.0.1:4173',
    socketOrigin: 'ws://127.0.0.1:4173',
  };
  fs.writeFileSync(filename, JSON.stringify(manifest));
  assert.throws(
    () => verify(directory, metadata.sourceRef, '/v2/', 'https://oj.qd.sdu.edu.cn/v2/'),
    /cannot be deployed/,
  );
  assert.throws(
    () => verify(directory, metadata.sourceRef, '/v2/'),
    /HTML deployment metadata mismatch/,
  );
});

test('standalone verifier returns a machine-readable report and fails closed', (context) => {
  const directory = fixture(context);
  create(directory, metadata);
  const script = path.join(__dirname, 'release-artifact.cjs');
  const output = execFileSync(
    process.execPath,
    [script, 'verify', directory, metadata.sourceRef, '/v2/'],
    { encoding: 'utf8' },
  );
  assert.equal(JSON.parse(output).status, 'verified');
  const rejected = spawnSync(
    process.execPath,
    [script, 'verify', directory, 'b'.repeat(40), '/v2/'],
    { encoding: 'utf8' },
  );
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /source ref mismatch/);
});

function creatorFixture(context) {
  const build = fixture(context);
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-creator-'));
  context.after(() => fs.rmSync(project, { recursive: true, force: true }));
  fs.mkdirSync(path.join(project, 'scripts'));
  const script = path.join(project, 'scripts/release-artifact.cjs');
  fs.copyFileSync(path.join(__dirname, 'release-artifact.cjs'), script);
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ version: '1.0.0' }));
  const environment = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) =>
        !key.startsWith('GIT_') &&
        !['GITHUB_SHA', 'SDUOJ_RELEASE_ID', 'SOURCE_DATE_EPOCH'].includes(key),
    ),
  );
  const git = (...args) =>
    execFileSync('git', args, { cwd: project, env: environment, encoding: 'utf8' }).trim();
  git('init', '--quiet');
  git('add', '.');
  git(
    '-c',
    'user.name=Artifact test',
    '-c',
    'user.email=artifact-test@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--quiet',
    '-m',
    'fixture',
  );
  const ref = git('rev-parse', 'HEAD');
  return { build, project, script, ref, environment: { ...environment, GITHUB_SHA: ref } };
}

test('actual creator and verifier reproduce manifest bytes with a fixed SOURCE_DATE_EPOCH', (context) => {
  const { build, script, ref, environment } = creatorFixture(context);
  const env = { ...environment, SOURCE_DATE_EPOCH: '1788534000' };
  const createOnce = () => execFileSync(process.execPath, [script, 'create', build], { env });
  createOnce();
  const filename = path.join(build, 'release-manifest.json');
  const first = fs.readFileSync(filename);
  createOnce();
  assert.deepEqual(fs.readFileSync(filename), first);
  const manifest = JSON.parse(first);
  assert.equal(manifest.createdAt, new Date(1788534000 * 1000).toISOString());
  assert.equal(manifest.releaseId, `1788534000000-${ref.slice(0, 12)}`);
  assert.equal(
    JSON.parse(
      execFileSync(process.execPath, [script, 'verify', build, ref, '/v2/'], {
        env,
        encoding: 'utf8',
      }),
    ).status,
    'verified',
  );
});

test('creator rejects invalid or overflowing SOURCE_DATE_EPOCH before writing metadata', (context) => {
  const { build, script, environment } = creatorFixture(context);
  for (const epoch of [
    '',
    '-1',
    '1.5',
    ' 1',
    '1e3',
    'Infinity',
    '253402300800',
    '8640000000001',
    '999999999999999999999',
  ]) {
    const result = spawnSync(process.execPath, [script, 'create', build], {
      env: { ...environment, SOURCE_DATE_EPOCH: epoch },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1, epoch);
    assert.match(result.stderr, /SOURCE_DATE_EPOCH/);
    assert.equal(fs.existsSync(path.join(build, 'release-manifest.json')), false);
  }
});

test('creator accepts epoch zero and retains wall-clock defaults when no epoch is supplied', (context) => {
  const { build, script, ref, environment } = creatorFixture(context);
  execFileSync(process.execPath, [script, 'create', build], {
    env: { ...environment, SOURCE_DATE_EPOCH: '0' },
  });
  let manifest = JSON.parse(fs.readFileSync(path.join(build, 'release-manifest.json')));
  assert.equal(manifest.createdAt, '1970-01-01T00:00:00.000Z');
  assert.equal(manifest.releaseId, `0-${ref.slice(0, 12)}`);
  const before = Date.now();
  execFileSync(process.execPath, [script, 'create', build], { env: environment });
  manifest = JSON.parse(fs.readFileSync(path.join(build, 'release-manifest.json')));
  assert.ok(
    Date.parse(manifest.createdAt) >= before && Date.parse(manifest.createdAt) <= Date.now(),
  );
  assert.equal(manifest.releaseId, `${Date.parse(manifest.createdAt)}-${ref.slice(0, 12)}`);
});

test('deployment rejects corrupt local and remote staged artifacts before applying a release', (context) => {
  for (const corruptLocal of [true, false]) {
    const project = fixture(context, '/v2-pre/');
    const build = path.join(project, 'build');
    fs.mkdirSync(build);
    for (const entry of fs.readdirSync(project)) {
      if (entry !== 'build') fs.renameSync(path.join(project, entry), path.join(build, entry));
    }
    create(build, { ...metadata, publicPath: '/v2-pre/' });
    fs.mkdirSync(path.join(project, 'scripts'));
    fs.copyFileSync(
      path.join(__dirname, 'release-artifact.cjs'),
      path.join(project, 'scripts/release-artifact.cjs'),
    );
    if (corruptLocal) fs.writeFileSync(path.join(build, 'static/js/main.456def.js'), 'tampered');
    const source = fs
      .readFileSync(path.join(__dirname, 'release-v2-pre.sh'), 'utf8')
      .split('\ncase "${1:-}"')[0];
    const functionsFile = path.join(project, 'scripts/release-functions.sh');
    fs.writeFileSync(functionsFile, source);
    const result = spawnSync(
      'bash',
      [
        '-c',
        `source "$AUDIT_FUNCTIONS"
PROJECT_ROOT="$AUDIT_PROJECT"
REMOTE_USER=isolated
build_pre() { :; }
plan() { :; }
smoke() { printf '{"manifestSha256":"%s"}\\n' ${'b'.repeat(64)}; }
git() { printf '%s\\n' "$AUDIT_REF"; }
rsync_remote() { printf 'UPLOAD\\n'; }
ssh_run() { if [[ "$*" == node* ]]; then printf 'REMOTE_REJECTED\\n'; return 1; fi; }
remote_apply() { printf 'UNSAFE_APPLY\\n'; }
deploy fixture
`,
      ],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          AUDIT_PROJECT: project,
          AUDIT_REF: metadata.sourceRef,
          AUDIT_FUNCTIONS: functionsFile,
        },
      },
    );
    assert.equal(result.status, 1, result.stderr);
    assert.doesNotMatch(result.stdout, /UNSAFE_APPLY/);
    if (corruptLocal) assert.doesNotMatch(result.stdout, /UPLOAD/);
    else assert.match(result.stdout, /REMOTE_REJECTED/);
  }
});
