const fs = require('node:fs');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const prettier = require('prettier');

async function main() {
  const files = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    { encoding: 'utf8' },
  )
    .split('\0')
    .filter(Boolean);
  const filename = 'config/format-baseline.json';
  const baseline = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf8')) : {};
  const mismatches = {};
  const errors = [];
  for (const file of new Set(files)) {
    if (!fs.existsSync(file)) continue;
    const info = await prettier.getFileInfo(file, { ignorePath: '.prettierignore' });
    if (info.ignored || !info.inferredParser) continue;
    const source = fs.readFileSync(file, 'utf8');
    if (
      !(await prettier.check(source, { ...(await prettier.resolveConfig(file)), filepath: file }))
    ) {
      const hash = crypto.createHash('sha256').update(source).digest('hex');
      mismatches[file] = hash;
      if (baseline[file] !== hash) errors.push(file);
    }
  }
  if (process.argv.includes('--update-baseline')) {
    fs.writeFileSync(
      filename,
      JSON.stringify(Object.fromEntries(Object.entries(mismatches).sort()), null, 2) + '\n',
    );
    console.log(
      `Recorded ${Object.keys(mismatches).length} legacy files. Review baseline changes explicitly.`,
    );
    return;
  }
  if (errors.length) {
    console.error(`Format these new or changed files with Prettier:\n${errors.join('\n')}`);
    process.exitCode = 1;
  }
  console.log(
    `Format: ${errors.length} failures; ${Object.keys(mismatches).length} unchanged legacy files retained.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
