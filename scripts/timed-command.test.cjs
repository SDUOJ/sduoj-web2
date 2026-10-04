const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const yaml = require('js-yaml');

const runner = path.join(__dirname, 'timed-command.cjs');
function invoke(seconds, source, options = {}) {
  return spawnSync(process.execPath, [runner, seconds, process.execPath, '-e', source], {
    encoding: 'utf8',
    timeout: 10000,
    ...options,
  });
}

test('preserves success, stderr, stdin and command failure status', () => {
  const result = invoke(
    '5',
    'process.stdin.on("data", data => process.stdout.write(data)); console.error("diagnostic");',
    { input: 'fixture input' },
  );
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'fixture input');
  assert.match(result.stderr, /diagnostic/);
  assert.equal(invoke('5', 'process.exit(17)').status, 17);
});

test('rejects invalid bounds and missing executables without hanging', () => {
  for (const seconds of ['0', '-1', '1.5', '3601', 'NaN']) {
    assert.equal(invoke(seconds, '').status, 2);
  }
  const missing = spawnSync(process.execPath, [runner, '1', '/nonexistent/sduoj-command'], {
    encoding: 'utf8',
    timeout: 5000,
  });
  assert.equal(missing.status, 127);
  assert.match(missing.stderr, /failed to start/);
});

test('terminates a hung child and escalates when SIGTERM is ignored', () => {
  const started = Date.now();
  const result = invoke('1', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 100);');
  assert.equal(result.status, 124);
  assert.match(result.stderr, /timed out after 1s/);
  assert.ok(Date.now() - started < 5000);
});

test('timeout stops descendants even if the direct child exits on SIGTERM', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-timeout-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const heartbeat = path.join(directory, 'heartbeat');
  const descendant = `process.on('SIGTERM',()=>{});setInterval(()=>require('fs').appendFileSync(${JSON.stringify(heartbeat)},'x'),50);`;
  const source = `require('child_process').spawn(process.execPath,['-e',${JSON.stringify(descendant)}],{stdio:'inherit'});setInterval(()=>{},100);`;
  const result = invoke('1', source);
  assert.equal(result.status, 124);
  const size = fs.statSync(heartbeat).size;
  return new Promise((resolve) =>
    setTimeout(() => {
      assert.equal(fs.statSync(heartbeat).size, size);
      resolve();
    }, 200),
  );
});

test('external cancellation stops the child and returns a signal status', async () => {
  const wrapper = spawn(
    process.execPath,
    [runner, '30', process.execPath, '-e', 'console.log("ready");setInterval(()=>{},100);'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  const exit = new Promise((resolve) => wrapper.once('exit', (code) => resolve(code)));
  await new Promise((resolve) => wrapper.stdout.once('data', resolve));
  wrapper.kill('SIGTERM');
  assert.equal(await exit, 143);
});

test('all active runner jobs have a bounded timeout', () => {
  const directory = path.resolve(__dirname, '../.github/workflows');
  for (const filename of fs.readdirSync(directory).filter((file) => /\.ya?ml$/.test(file))) {
    const workflow = yaml.load(fs.readFileSync(path.join(directory, filename), 'utf8'));
    for (const [name, job] of Object.entries(workflow.jobs)) {
      if (!job['runs-on']) continue;
      assert.ok(Number.isInteger(job['timeout-minutes']), `${filename}/${name}: timeout required`);
      assert.ok(
        job['timeout-minutes'] >= 1 && job['timeout-minutes'] <= 30,
        `${filename}/${name}: timeout out of range`,
      );
    }
  }
});

test('hung SSH is bounded and standalone rollback remains callable after the timeout', (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-release-timeout-'));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const ssh = path.join(directory, 'ssh');
  fs.writeFileSync(ssh, '#!/bin/bash\nwhile true; do sleep 1; done\n', { mode: 0o755 });
  const source = fs
    .readFileSync(path.join(__dirname, 'release-v2-pre.sh'), 'utf8')
    .split('\ncase "${1:-}"')[0];
  const environment = {
    ...process.env,
    PATH: `${directory}:${process.env.PATH}`,
    SDUOJ_DEPLOY_USER: 'fixture',
    SDUOJ_RELEASE_COMMAND_TIMEOUT_SECONDS: '1',
    AUDIT_SCRIPTS: __dirname,
  };
  const timedOut = spawnSync(
    'bash',
    ['-c', `${source}\nSCRIPT_DIR="$AUDIT_SCRIPTS"\nssh_run readonly-fixture\n`],
    { encoding: 'utf8', env: environment, timeout: 10000 },
  );
  assert.equal(timedOut.status, 124);
  assert.match(timedOut.stderr, /timed out after 1s/);
  const rollback = spawnSync(
    'bash',
    [
      '-c',
      `${source}
plan() { :; }
ssh_run() { [[ "$1" == timeout && "$2" == 1 && "$3" == bash ]]; cat >/dev/null; printf 'BOUNDED_ROLLBACK\\n'; }
smoke() { printf 'SMOKE_OK\\n'; }
rollback
`,
    ],
    { encoding: 'utf8', env: environment, timeout: 5000 },
  );
  assert.equal(rollback.status, 0, rollback.stderr);
  assert.match(rollback.stdout, /BOUNDED_ROLLBACK/);
  assert.match(rollback.stdout, /SMOKE_OK/);
});
