const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function shellFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const filename = path.join(directory, entry.name);
      return entry.isDirectory()
        ? shellFiles(filename)
        : entry.isFile() && entry.name.endsWith('.sh')
          ? [filename]
          : [];
    })
    .sort();
}

function check(
  root = path.resolve(__dirname, '..'),
  binaries = path.join(root, 'output/static-checkers/bin'),
) {
  const workflowDirectory = path.join(root, '.github/workflows');
  const workflows = fs.existsSync(workflowDirectory)
    ? fs
        .readdirSync(workflowDirectory)
        .filter((filename) => /\.ya?ml$/.test(filename))
        .sort()
        .map((filename) => path.join(workflowDirectory, filename))
    : [];
  const scripts = shellFiles(path.join(root, 'scripts'));
  const shellcheck = path.join(binaries, 'shellcheck');
  const jobs = [
    { name: 'actionlint', files: workflows, args: ['-shellcheck', shellcheck, ...workflows] },
    { name: 'shellcheck', files: scripts, args: ['--severity=style', ...scripts] },
  ];
  const results = jobs.map((job) => {
    if (!job.files.length)
      return { name: job.name, status: 0, skipped: true, files: [], stdout: '', stderr: '' };
    const result = spawnSync(path.join(binaries, job.name), job.args, {
      cwd: root,
      encoding: 'utf8',
      timeout: 60000,
    });
    return {
      name: job.name,
      status: result.status ?? 1,
      files: job.files.map((filename) => path.relative(root, filename)),
      stdout: result.stdout ?? '',
      stderr: result.error ? result.error.message : (result.stderr ?? ''),
    };
  });
  return { success: results.every((result) => result.status === 0), results };
}

module.exports = { check, shellFiles };
if (require.main === module) {
  const report = check();
  console.log(JSON.stringify(report, null, 2));
  if (!report.success) process.exitCode = 1;
}
