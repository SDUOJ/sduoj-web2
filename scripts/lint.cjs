const fs = require('node:fs');
const path = require('node:path');
const { ESLint } = require('eslint');

async function main() {
  const results = await new ESLint().lintFiles(['src/**/*.{ts,tsx}']);
  const warnings = {};
  const errors = [];
  for (const result of results) {
    const file = path.relative(process.cwd(), result.filePath).split(path.sep).join('/');
    for (const message of result.messages) {
      if (message.severity === 2)
        errors.push(`${file}:${message.line} ${message.ruleId}: ${message.message}`);
      else {
        const key = `${file}:${message.ruleId}`;
        warnings[key] = (warnings[key] || 0) + 1;
      }
    }
  }
  const baselinePath = path.join(__dirname, '../config/lint-baseline.json');
  if (process.argv.includes('--update-baseline')) {
    if (errors.length) throw new Error('Resolve lint errors before recording the baseline');
    fs.writeFileSync(
      baselinePath,
      JSON.stringify(Object.fromEntries(Object.entries(warnings).sort()), null, 2) + '\n',
    );
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  for (const [key, count] of Object.entries(warnings)) {
    if (count > (baseline[key] || 0))
      errors.push(`${key}: ${count} warnings exceeds baseline ${baseline[key] || 0}`);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  }
  console.log(
    `Lint: ${errors.length} errors; ${Object.values(warnings).reduce((a, b) => a + b, 0)} tracked legacy warnings. No increases allowed per file and rule.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
