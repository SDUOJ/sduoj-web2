const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { assetRevision, revision } = require('../config/vditor-assets.cjs');

function fixture(context) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-vditor-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'js'));
  fs.writeFileSync(path.join(directory, 'index.min.js'), 'runtime-v1');
  fs.writeFileSync(path.join(directory, 'js/lute.min.js'), 'lute-v1');
  return directory;
}

test('revision depends on every asset name and content, not timestamps', (context) => {
  const directory = fixture(context);
  const original = assetRevision(directory);
  assert.match(original, /^[a-f0-9]{64}$/);
  fs.utimesSync(path.join(directory, 'index.min.js'), new Date(0), new Date(0));
  assert.equal(assetRevision(directory), original);
  fs.writeFileSync(path.join(directory, 'js/lute.min.js'), 'lute-v2');
  assert.notEqual(assetRevision(directory), original);
  fs.writeFileSync(path.join(directory, 'js/lute.min.js'), 'lute-v1');
  assert.equal(assetRevision(directory), original);
  fs.renameSync(path.join(directory, 'js/lute.min.js'), path.join(directory, 'js/renamed.min.js'));
  assert.notEqual(assetRevision(directory), original);
});

test('release update and rollback restore the matching URL namespace', (context) => {
  const directory = fixture(context);
  const oldRevision = assetRevision(directory);
  const oldBytes = fs.readFileSync(path.join(directory, 'index.min.js'));
  fs.writeFileSync(path.join(directory, 'index.min.js'), 'runtime-v2');
  const newRevision = assetRevision(directory);
  assert.notEqual(
    `/v2/vditor/${oldRevision}/dist/index.min.js`,
    `/v2/vditor/${newRevision}/dist/index.min.js`,
  );
  fs.writeFileSync(path.join(directory, 'index.min.js'), oldBytes);
  assert.equal(assetRevision(directory), oldRevision);
  assert.match(revision, /^[a-f0-9]{64}$/);
});

test('empty and symlink distributions fail closed', (context) => {
  const directory = fixture(context);
  fs.symlinkSync('../index.min.js', path.join(directory, 'js/link.js'));
  assert.throws(() => assetRevision(directory), /symlink rejected/);
  fs.rmSync(directory, { force: true, recursive: true });
  fs.mkdirSync(directory);
  assert.throws(() => assetRevision(directory), /empty/);
});

test('build injection cannot override the content revision with an environment variable', () => {
  const output = execFileSync(
    process.execPath,
    ['-e', 'console.log(require("./config/env")("/v2/").raw.REACT_APP_VDITOR_REVISION)'],
    {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        REACT_APP_VDITOR_REVISION: 'attacker-controlled',
      },
    },
  );
  assert.equal(output.trim(), revision);
});
