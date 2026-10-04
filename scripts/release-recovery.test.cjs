const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, 'release-v2-pre.sh'), 'utf8');
const functions = source.slice(0, source.lastIndexOf('\ncase '));
const quote = (value) => `'${value.replaceAll("'", "'\\''")}'`;

function fixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-release-recovery-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(
    path.join(bin, 'timeout'),
    `#!${process.execPath}\nrequire(${JSON.stringify(path.join(__dirname, 'timed-command.cjs'))}).run(process.argv[2], process.argv[3], process.argv.slice(4));\n`,
    { mode: 0o755 },
  );
  for (const [name, version] of [
    ['v2-pre', 'current'],
    ['v2-pre-backup', 'older'],
    ['.v2-pre-release-case1', 'new'],
    ['v2', 'formal'],
  ]) {
    fs.mkdirSync(path.join(root, name));
    fs.writeFileSync(path.join(root, name, 'index.html'), `/v2-pre/ ${version}`);
    fs.writeFileSync(path.join(root, name, 'chunk.js'), version);
  }
  fs.writeFileSync(
    path.join(bin, 'rsync'),
    `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const counter = process.env.RECOVERY_COUNTER;
const count = fs.existsSync(counter) ? Number(fs.readFileSync(counter, 'utf8')) + 1 : 1;
fs.writeFileSync(counter, String(count));
const [source, destination] = process.argv.slice(-2);
if ((process.env.RECOVERY_FAILURES || '').split(',').includes(String(count))) {
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, 'index.html'), 'partial transfer');
  process.exit(1);
}
if (process.env.RECOVERY_INTERRUPT === String(count)) {
  fs.writeFileSync(path.join(destination, 'index.html'), 'interrupted transfer');
  process.kill(process.ppid, 'SIGTERM');
  process.exit(1);
}
fs.rmSync(destination, { force: true, recursive: true });
fs.cpSync(source, destination, { recursive: true });
`,
    { mode: 0o755 },
  );
  const run = (body, environment = {}) =>
    spawnSync(
      'bash',
      [
        '-c',
        `${functions}\nREMOTE_ROOT=${quote(root)}\nPROJECT_ROOT=${quote(root)}\nSCRIPT_DIR=${quote(__dirname)}\ngit() { printf '%s\\n' ${'a'.repeat(40)}; }\nssh_run() { bash -s; }\n${body}`,
      ],
      {
        encoding: 'utf8',
        timeout: 10000,
        env: {
          ...process.env,
          PATH: `${bin}:${process.env.PATH}`,
          SDUOJ_DEPLOY_USER: 'local-test-only',
          RECOVERY_COUNTER: path.join(root, 'rsync-count'),
          ...environment,
        },
      },
    );
  const version = (name) => fs.readFileSync(path.join(root, name, 'chunk.js'), 'utf8');
  return { root, run, version };
}

test('successful apply snapshots current, preserves formal release and installs usable rollback', (context) => {
  const { root, run, version } = fixture(context);
  assert.equal(run('remote_apply case1').status, 0);
  assert.equal(version('v2-pre'), 'new');
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('v2'), 'formal');
  assert.equal(fs.existsSync(path.join(root, '.v2-pre-backup-old-case1')), false);
  assert.equal(run(`bash ${quote(path.join(root, 'rollback-v2-pre.sh'))}`).status, 0);
  assert.equal(version('v2-pre'), 'current');
});

test('failed snapshot never rotates or removes the existing backup', (context) => {
  const { root, run, version } = fixture(context);
  assert.notEqual(run('remote_apply case1', { RECOVERY_FAILURES: '1' }).status, 0);
  assert.equal(version('v2-pre'), 'current');
  assert.equal(version('v2-pre-backup'), 'older');
  assert.equal(fs.existsSync(path.join(root, '.v2-pre-backup-new-case1')), false);
});

test('failed apply restores current while retaining both valid recovery copies', (context) => {
  const { run, version } = fixture(context);
  const result = run('remote_apply case1', { RECOVERY_FAILURES: '2' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /current restored/);
  assert.equal(version('v2-pre'), 'current');
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('.v2-pre-backup-old-case1'), 'older');
});

test('failed automatic recovery preserves both snapshots and stage for a later rollback', (context) => {
  const { root, run, version } = fixture(context);
  const result = run('remote_apply case1', { RECOVERY_FAILURES: '2,3' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /manual recovery/);
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('.v2-pre-backup-old-case1'), 'older');
  assert.equal(version('.v2-pre-release-case1'), 'new');
  assert.equal(run(`bash ${quote(path.join(root, 'rollback-v2-pre.sh'))}`).status, 0);
  assert.equal(version('v2-pre'), 'current');
});

test('interrupted apply leaves an independently usable previous release', (context) => {
  const { root, run, version } = fixture(context);
  assert.notEqual(run('remote_apply case1', { RECOVERY_INTERRUPT: '2' }).status, 0);
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('.v2-pre-backup-old-case1'), 'older');
  assert.equal(run(`bash ${quote(path.join(root, 'rollback-v2-pre.sh'))}`).status, 0);
  assert.equal(version('v2-pre'), 'current');
});

test('reused release id cannot delete retained recovery files', (context) => {
  const { root, run, version } = fixture(context);
  const retained = path.join(root, '.v2-pre-backup-old-case1');
  fs.mkdirSync(retained);
  fs.writeFileSync(path.join(retained, 'chunk.js'), 'retained');
  const result = run('remote_apply case1');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /new release id/);
  assert.equal(version('.v2-pre-backup-old-case1'), 'retained');
  assert.equal(version('v2-pre-backup'), 'older');
  assert.equal(version('v2-pre'), 'current');
});

test('smoke failure returns to the caller instead of exiting before its rollback branch', (context) => {
  const { run } = fixture(context);
  const result = run(
    `node() { echo 'smoke fixture failed' >&2; return 1; }\nif ! smoke; then echo rollback-reachable; fi`,
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /rollback-reachable/);
  assert.match(result.stderr, /smoke fixture failed/);
});

test('deploy cannot overwrite evidence for an existing release id', (context) => {
  const { root, run, version } = fixture(context);
  const evidence = path.join(root, 'output/release-smoke/case1/before.json');
  fs.mkdirSync(path.dirname(evidence), { recursive: true });
  fs.writeFileSync(evidence, 'retained smoke evidence');
  const result = run('build_pre() { :; }\nplan() { :; }\ndeploy case1');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /smoke evidence already exists/);
  assert.equal(fs.readFileSync(evidence, 'utf8'), 'retained smoke evidence');
  assert.equal(version('v2-pre'), 'current');
  assert.equal(version('v2-pre-backup'), 'older');
});

test('post-deploy smoke failure actually restores the backup and still fails the deployment', (context) => {
  const { run, version } = fixture(context);
  const result = run(`
build_pre() { :; }
plan() { :; }
node() { if [ "$1" = -p ]; then printf '%s\\n' ${'b'.repeat(64)}; fi; }
rsync_remote() { :; }
ssh_run() { if [ "$1" = timeout ]; then bash -s; fi; }
smoke_count=0
smoke() { smoke_count=$((smoke_count + 1)); [ "$smoke_count" -ne 2 ]; }
deploy case1
`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /post-deploy smoke failed; rollback attempted/);
  assert.equal(version('v2-pre'), 'current');
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('v2'), 'formal');
});

test('deploy does not remove stage after apply and automatic recovery both fail', (context) => {
  const { root, run, version } = fixture(context);
  const result = run(
    `
build_pre() { :; }
plan() { :; }
node() { if [ "$1" = -p ]; then printf '%s\\n' ${'b'.repeat(64)}; fi; }
rsync_remote() { :; }
ssh_run() { if [ "$1" = timeout ]; then bash -s; else printf '%s\\n' "$*" >> "$REMOTE_ROOT/ssh-commands"; fi; }
smoke() { :; }
deploy case1
`,
    { RECOVERY_FAILURES: '2,3' },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /staging and recovery copies retained/);
  assert.equal(version('.v2-pre-release-case1'), 'new');
  assert.equal(version('v2-pre-backup'), 'current');
  assert.equal(version('.v2-pre-backup-old-case1'), 'older');
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'ssh-commands'), 'utf8'), /rm -rf/);
});
