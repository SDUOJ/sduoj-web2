const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const base = process.argv[2] || 'HEAD';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const baseFiles = git('ls-tree', '-r', '--name-only', base, 'src')
  .trim()
  .split('\n')
  .filter((file) => /\.tsx?$/.test(file));
const currentFiles = execFileSync('rg', ['--files', 'src'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter((file) => /\.tsx?$/.test(file));

function measure(files, read) {
  const result = {
    productionFiles: 0,
    testFiles: 0,
    lines: 0,
    any: 0,
    asAny: 0,
    nonNullAssertions: 0,
    tsIgnore: 0,
  };
  const modules = [];
  for (const file of files) {
    if (/\.test\./.test(file)) {
      result.testFiles++;
      continue;
    }
    const source = read(file);
    const module = { file, lines: source.split('\n').length, any: 0 };
    result.productionFiles++;
    result.lines += module.lines;
    result.tsIgnore += (source.match(/@ts-ignore\b/g) || []).length;
    const visit = (node) => {
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        result.any++;
        module.any++;
      }
      if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword) result.asAny++;
      if (ts.isNonNullExpression(node)) result.nonNullAssertions++;
      ts.forEachChild(node, visit);
    };
    visit(ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true));
    modules.push(module);
  }
  return { ...result, modules };
}

const baseline = measure(baseFiles, (file) => git('show', `${base}:${file}`));
const comparable = measure(
  baseFiles.filter((file) => fs.existsSync(file)),
  (file) => fs.readFileSync(file, 'utf8'),
);
const current = measure(currentFiles, (file) => fs.readFileSync(file, 'utf8'));
const summarize = ({ modules, ...counts }) => counts;
console.log(
  JSON.stringify(
    {
      base: git('rev-parse', base).trim(),
      baseline: summarize(baseline),
      comparableCurrent: summarize(comparable),
      currentIncludingUntracked: summarize(current),
      anyReductionInBaselineFiles: baseline.any - comparable.any,
      highestAnyFiles: current.modules.sort((a, b) => b.any - a.any).slice(0, 15),
      largestFiles: current.modules.sort((a, b) => b.lines - a.lines).slice(0, 10),
    },
    null,
    2,
  ),
);
