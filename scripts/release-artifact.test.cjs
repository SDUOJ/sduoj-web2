const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');
const { create, verify, permitted } = require('./release-artifact.cjs');

const metadata = {
  sourceRef: 'a'.repeat(40),
  publicPath: '/v2/',
  version: '0.1.0',
  createdAt: '2026-10-04T00:00:00.000Z',
  releaseId: 'audit-fixture',
};

function fixture(context, prefix = '/v2/') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-artifact-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'static/js'), { recursive: true });
  fs.mkdirSync(path.join(directory, 'vditor/dist'), { recursive: true });
  const entrypoints = ['static/js/runtime-main.123abc.js', 'static/js/main.456def.js'];
  for (const filename of entrypoints)
    fs.writeFileSync(path.join(directory, filename), 'window.fixture=true;');
  fs.writeFileSync(path.join(directory, 'vditor/dist/index.min.js'), 'window.Vditor={};');
  fs.writeFileSync(
    path.join(directory, 'index.html'),
    `<div id="root"></div>${entrypoints.map((entry) => `<script src="${prefix}${entry}"></script>`).join('')}`,
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
    'vditor/dist/types/index.d.ts',
    'vditor/dist/js/mathjax/LICENSE',
  ]) {
    assert.equal(permitted(filename), true, filename);
  }
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
    const result = spawnSync(
      'bash',
      [
        '-c',
        `${source}
PROJECT_ROOT="$AUDIT_PROJECT"
REMOTE_USER=isolated
build_pre() { :; }
plan() { :; }
smoke() { :; }
git() { printf '%s\\n' "$AUDIT_REF"; }
rsync_remote() { printf 'UPLOAD\\n'; }
ssh_run() { if [[ "$*" == node* ]]; then printf 'REMOTE_REJECTED\\n'; return 1; fi; }
remote_apply() { printf 'UNSAFE_APPLY\\n'; }
deploy fixture
`,
      ],
      {
        encoding: 'utf8',
        env: { ...process.env, AUDIT_PROJECT: project, AUDIT_REF: metadata.sourceRef },
      },
    );
    assert.equal(result.status, 1, result.stderr);
    assert.doesNotMatch(result.stdout, /UNSAFE_APPLY/);
    if (corruptLocal) assert.doesNotMatch(result.stdout, /UPLOAD/);
    else assert.match(result.stdout, /REMOTE_REJECTED/);
  }
});
