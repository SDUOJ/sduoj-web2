const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const standalone = require('ajv/dist/standalone').default;

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src/Config/validation/autolab.json');
const destination = path.join(root, 'src/Config/validation/generated/autolab-validators.js');

function externalReferences(schema) {
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
}

function generate(source) {
  const spec = JSON.parse(source);
  const ajv = new Ajv({
    strict: false,
    allErrors: false,
    coerceTypes: true,
    code: { source: true },
  });
  addFormats(ajv);
  ajv.addFormat('binary', true);
  ajv.addSchema({ $id: 'urn:sduoj:autolab', components: spec.components });
  const exports = {};
  const signatures = new Map();
  const register = (schema) => {
    const normalized = externalReferences(schema);
    const signature = JSON.stringify(normalized);
    if (signatures.has(signature)) return signatures.get(signature);
    const name = `validate${signatures.size}`;
    const id = `urn:sduoj:validator:${name}`;
    ajv.addSchema(normalized, id);
    exports[name] = id;
    signatures.set(signature, name);
    return name;
  };
  const routes = Object.entries(spec.routes).map(([route, schema]) => [route, register(schema)]);
  const fields = [];
  const resolve = (schema, visited = new Set()) => {
    if (schema.$ref) {
      if (visited.has(schema.$ref)) return {};
      visited.add(schema.$ref);
      return resolve(spec.components.schemas[schema.$ref.split('/').pop()] ?? {}, visited);
    }
    if (schema.allOf?.length === 1) return resolve(schema.allOf[0], visited);
    if (schema.anyOf)
      return resolve(schema.anyOf.find((option) => option.type !== 'null') ?? {}, visited);
    return schema;
  };
  const walk = (model, schema, parts, ancestry) => {
    if (parts.length > 0) {
      const parentRequired = ancestry.required;
      const name = register({
        type: 'object',
        properties: { value: schema },
        ...(parentRequired ? { required: ['value'] } : {}),
      });
      fields.push([JSON.stringify([model, ...parts]), name]);
    }
    const parent = resolve(schema);
    if (ancestry.schemas.has(parent)) return;
    const schemas = new Set(ancestry.schemas).add(parent);
    for (const [name, child] of Object.entries(parent.properties ?? {}))
      walk(model, child, [...parts, name], {
        schemas,
        required: parent.required?.includes(name) ?? false,
      });
    if (parent.items) walk(model, parent.items, [...parts, '*'], { schemas, required: true });
  };
  for (const [model, schema] of Object.entries(spec.components.schemas))
    walk(model, schema, [], { schemas: new Set(), required: false });
  const mapping = (name, entries) =>
    `\nexports.${name} = {${entries.map(([key, validator]) => `${JSON.stringify(key)}:exports.${validator}`).join(',')}};\n`;
  return (
    `"use strict";\nexports.schemaSha256=${JSON.stringify(crypto.createHash('sha256').update(source).digest('hex'))};\n` +
    standalone(ajv, exports) +
    mapping('routes', routes) +
    mapping('fields', fields)
  );
}

function verify() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const artifact = require(destination);
  if (artifact.schemaSha256 !== crypto.createHash('sha256').update(source).digest('hex'))
    throw new Error('Standalone AutoLab validators are stale; run yarn validation:compile');
}

function main(check = process.argv.includes('--check')) {
  const generated = generate(fs.readFileSync(sourcePath, 'utf8'));
  if (check) {
    if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== generated)
      throw new Error('Standalone AutoLab validators are stale; run yarn validation:compile');
  } else {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, generated);
  }
  console.log(
    `Standalone AutoLab validators ${check ? 'verified' : 'generated'}: ${Buffer.byteLength(generated)} bytes`,
  );
}

module.exports = { generate, verify };
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
