'use strict';

const fs = require('fs');
const path = require('path');

const workflowDir = path.join(process.cwd(), '.github', 'workflows');
const shaRef = /^[0-9a-f]{40}$/;
const errors = [];
for (const file of fs.readdirSync(workflowDir).filter((name) => /\\.(yml|yaml)$/.test(name))) {
  const source = fs.readFileSync(path.join(workflowDir, file), 'utf8');
  for (const [lineNumber, line] of source.split(/\\r?\\n/).entries()) {
    const match = line.match(/\\buses:\\s*([^\\s#]+)/);
    if (!match || match[1].startsWith('./') || match[1].startsWith('../')) continue;
    const at = match[1].lastIndexOf('@');
    if (at < 1 || !shaRef.test(match[1].slice(at + 1))) {
      errors.push(
        `${file}:${lineNumber + 1}: external action must use a 40-character commit SHA (${match[1]})`,
      );
    }
  }
}
if (errors.length) {
  console.error(errors.join('\\n'));
  process.exit(1);
}
console.log('Workflow action references are pinned to commit SHAs.');
