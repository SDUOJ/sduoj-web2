const { spawn } = require('node:child_process');

function run(seconds, command, args) {
  if (!/^\d+$/.test(seconds) || Number(seconds) < 1 || Number(seconds) > 3600 || !command) {
    console.error('Usage: timed-command.cjs <seconds:1..3600> <command> [args...]');
    process.exitCode = 2;
    return;
  }
  const child = spawn(command, args, { stdio: 'inherit', detached: true });
  let timedOut = false;
  let receivedSignal;
  let escalation;
  const killGroup = (signal) => {
    if (!child.pid) return;
    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  const terminate = () => {
    killGroup('SIGTERM');
    escalation = setTimeout(() => killGroup('SIGKILL'), 1000);
  };
  const timeout = setTimeout(
    () => {
      timedOut = true;
      console.error(`Command timed out after ${seconds}s: ${command}`);
      terminate();
    },
    Number(seconds) * 1000,
  );
  const onInterrupt = () => {
    receivedSignal = 'SIGINT';
    terminate();
  };
  const onTerminate = () => {
    receivedSignal = 'SIGTERM';
    terminate();
  };
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onTerminate);
  const cleanup = () => {
    clearTimeout(timeout);
    if (escalation) clearTimeout(escalation);
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onTerminate);
  };
  child.once('error', (error) => {
    cleanup();
    console.error(`Command failed to start: ${error.message}`);
    process.exitCode = 127;
  });
  child.once('exit', (code, signal) => {
    if (timedOut || receivedSignal) {
      killGroup('SIGKILL');
    }
    cleanup();
    process.exitCode = timedOut
      ? 124
      : receivedSignal === 'SIGINT'
        ? 130
        : receivedSignal === 'SIGTERM'
          ? 143
          : (code ?? (signal ? 1 : 0));
  });
}

if (require.main === module) run(process.argv[2], process.argv[3], process.argv.slice(4));
module.exports = { run };
