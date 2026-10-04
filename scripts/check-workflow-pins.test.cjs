'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { checkWorkflowPins } = require('./check-workflow-pins.cjs');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-workflow-pins-'));
const workflowDir = path.join(root, '.github', 'workflows');
fs.mkdirSync(workflowDir, { recursive: true });

fs.writeFileSync(
  path.join(workflowDir, 'valid.yml'),
  'jobs:\n  verify:\n    steps:\n      - uses: actions/checkout@' + 'a'.repeat(40) + '\n',
);
assert.deepStrictEqual(checkWorkflowPins(root), []);

fs.writeFileSync(
  path.join(workflowDir, 'invalid.yml'),
  'jobs:\n  verify:\n    steps:\n      - uses: actions/checkout@v4\n',
);
assert.deepStrictEqual(checkWorkflowPins(root), [
  'invalid.yml:4: external action must use a 40-character commit SHA (actions/checkout@v4)',
]);

fs.writeFileSync(
  path.join(workflowDir, 'release.yml'),
  'jobs:\n  release:\n    steps:\n      - uses: actions/checkout@v4\n',
);
assert.deepStrictEqual(checkWorkflowPins(root), [
  'invalid.yml:4: external action must use a 40-character commit SHA (actions/checkout@v4)',
  'release.yml:4: external action must use a 40-character commit SHA (actions/checkout@v4)',
]);

fs.rmSync(root, { recursive: true, force: true });
console.log('Workflow pin checker tests passed.');
