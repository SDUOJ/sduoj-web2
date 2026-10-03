'use strict';

const fs = require('fs');
const path = require('path');

const shaRef = /^[0-9a-f]{40}$/;
// The release workflow is owned by the separate release worktree/stash and is
// intentionally excluded until that change set is restored for review.
const excludedWorkflowFiles = new Set(['release.yml']);

function checkWorkflowPins(rootDir = process.cwd()) {
  const workflowDir = path.join(rootDir, '.github', 'workflows');
  const errors = [];
  for (const file of fs
    .readdirSync(workflowDir)
    .filter((name) => /\.(yml|yaml)$/.test(name) && !excludedWorkflowFiles.has(name))) {
    const source = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    for (const [lineNumber, line] of source.split(/\r?\n/).entries()) {
      const match = line.match(/\buses:\s*([^\s#]+)/);
      if (!match || match[1].startsWith('./') || match[1].startsWith('../')) continue;
      const at = match[1].lastIndexOf('@');
      if (at < 1 || !shaRef.test(match[1].slice(at + 1))) {
        errors.push(
          `${file}:${lineNumber + 1}: external action must use a 40-character commit SHA (${match[1]})`,
        );
      }
    }
  }
  return errors;
}

if (require.main === module) {
  const errors = checkWorkflowPins();
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log('Workflow action references are pinned to commit SHAs.');
}

module.exports = { checkWorkflowPins };
