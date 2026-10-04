const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { check, shellFiles } = require('./check-static.cjs');
const { releases, install } = require('./install-static-checkers.cjs');

function fixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-static-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
  fs.mkdirSync(path.join(root, 'scripts/nested'), { recursive: true });
  return root;
}

test('tool distributions are pinned to versions and full archive checksums', () => {
  for (const tools of Object.values(releases)) {
    assert.deepEqual(
      tools.map((tool) => tool.name),
      ['actionlint', 'shellcheck'],
    );
    for (const tool of tools) {
      assert.match(tool.sha256, /^[a-f0-9]{64}$/);
      assert.ok(tool.url.startsWith('https://github.com/'));
      assert.ok(tool.url.includes(`/v${tool.version}/`));
      assert.ok(!tool.url.includes('latest'));
    }
  }
  assert.throws(() => install('unsupported-platform'), /Unsupported/);
});

test('empty script and workflow directories do not start commands waiting for stdin', (context) => {
  const report = check(fixture(context), '/nonexistent');
  assert.equal(report.success, true);
  assert.ok(report.results.every((result) => result.skipped));
});

test('missing checker binaries fail closed and retain diagnostics', (context) => {
  const root = fixture(context);
  fs.writeFileSync(path.join(root, '.github/workflows/release.yml'), 'jobs: {}');
  fs.writeFileSync(path.join(root, 'scripts/nested/file with spaces.sh'), 'true');
  const report = check(root, '/nonexistent');
  assert.equal(report.success, false);
  assert.equal(report.results[0].files[0], '.github/workflows/release.yml');
  assert.equal(report.results[1].files[0], 'scripts/nested/file with spaces.sh');
  assert.ok(report.results.every((result) => result.status !== 0 && /ENOENT/.test(result.stderr)));
  assert.equal(shellFiles(path.join(root, 'scripts')).length, 1);
});

test('remote rollback generation preserves literal remote variables without a local root', (context) => {
  const root = fixture(context);
  const source = fs
    .readFileSync(path.join(__dirname, 'release-v2-pre.sh'), 'utf8')
    .split('\ncase "${1:-}"')[0];
  const captured = path.join(root, 'remote-apply.sh');
  const result = spawnSync(
    'bash',
    [
      '-c',
      `${source}
unset root
ssh_run() { cat > "$AUDIT_CAPTURE"; }
remote_apply fixture
`,
    ],
    { encoding: 'utf8', env: { ...process.env, AUDIT_CAPTURE: captured }, timeout: 5000 },
  );
  assert.equal(result.status, 0, result.stderr);
  const emitted = fs.readFileSync(captured, 'utf8');
  const rollback = emitted.match(/<<'ROLLBACK'\n([\s\S]*?)\nROLLBACK/);
  assert.ok(rollback);
  assert.ok(rollback[1].includes('test -s "$root/v2-pre-backup/index.html"'));
  assert.ok(rollback[1].includes('timeout 300 rsync'));
  const script = path.join(root, 'rollback.sh');
  fs.writeFileSync(script, rollback[1]);
  const syntax = spawnSync('bash', ['-n', script], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
});
