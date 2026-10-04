const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { generate } = require('./compile-autolab-validators.cjs');

const source = fs.readFileSync('src/Config/validation/autolab.json', 'utf8');
const spec = JSON.parse(source);
const filename = 'src/Config/validation/generated/autolab-validators.js';
const compiled = require('../' + filename);

test('checked-in validators match deterministic generation and have no runtime compiler', () => {
  const generated = generate(source);
  assert.equal(fs.readFileSync(filename, 'utf8'), generated);
  assert.doesNotMatch(generated, /\bnew Function\s*\(|\beval\s*\(/);
  const exports = {};
  vm.runInNewContext(
    generated,
    {
      exports,
      require,
      Function: () => {
        throw new Error('Runtime compiler is forbidden');
      },
      eval: () => {
        throw new Error('Runtime eval is forbidden');
      },
    },
    { timeout: 10000 },
  );
  assert.equal(Object.keys(exports.routes).length, Object.keys(spec.routes).length);
  assert.equal(Object.keys(exports.fields).length, 928);
});

test('standalone request validators agree with Ajv for all checked-in routes', () => {
  const ajv = new Ajv({ strict: false, allErrors: false, coerceTypes: true });
  addFormats(ajv);
  ajv.addFormat('binary', true);
  ajv.addSchema({ $id: 'urn:sduoj:autolab', components: spec.components });
  const externalReferences = (schema) => {
    if (Array.isArray(schema)) return schema.map(externalReferences);
    if (schema && typeof schema === 'object')
      return Object.fromEntries(
        Object.entries(schema).map(([key, value]) => [
          key,
          key === '$ref' && typeof value === 'string' && value.startsWith('#')
            ? `urn:sduoj:autolab${value}`
            : externalReferences(value),
        ]),
      );
    return schema;
  };
  const inputs = [
    null,
    {},
    [],
    '1',
    { pageNow: '1', pageSize: '20', psid: '10' },
    { username: 'alice', sign_type: 0 },
    { start_time: 'invalid', end_time: 'invalid' },
  ];
  for (const [route, schema] of Object.entries(spec.routes)) {
    const reference = ajv.compile(externalReferences(schema));
    const standalone = compiled.routes[route];
    for (const input of inputs) {
      const original = structuredClone(input);
      const emitted = structuredClone(input);
      assert.equal(standalone(emitted), reference(original), route);
      assert.deepEqual(emitted, original, route);
      assert.deepEqual(standalone.errors, reference.errors, route);
    }
  }
});

test('schema changes fail freshness rather than silently using old validation', () => {
  const changed = JSON.parse(source);
  changed.components.schemas.CourseCreateRequest.properties.course_name.maxLength = 2;
  assert.notEqual(generate(JSON.stringify(changed)), fs.readFileSync(filename, 'utf8'));
});
