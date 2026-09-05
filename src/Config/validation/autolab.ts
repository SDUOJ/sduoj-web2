import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import spec from './autolab.json';

const ajv = new Ajv({ strict: false, allErrors: false, coerceTypes: true });
addFormats(ajv);
ajv.addFormat('binary', true);
ajv.addSchema({ $id: 'urn:sduoj:autolab', components: spec.components });

const routes = Object.entries(spec.routes).map(([route, schema]) => {
  const [method, path] = route.split(' ');
  const pattern = path
    .split('/')
    .map((part) => (part.startsWith('{') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return {
    method,
    pattern: new RegExp(`^${pattern}$`),
    schema,
    validate: undefined as ValidateFunction | undefined,
  };
});

function externalReferences(schema: unknown): unknown {
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

export function autolabSchemaError(
  path: string,
  payload: unknown,
  method = 'POST',
): string | undefined {
  const route = routes.find((route) => route.method === method && route.pattern.test(path));
  if (!route) return;
  if (!route.validate) route.validate = ajv.compile(externalReferences(route.schema) as object);
  // Match JSON serialization and Pydantic coercion without mutating the caller's draft.
  let copy;
  try {
    copy = JSON.parse(JSON.stringify(payload));
  } catch {
    return 'Invalid JSON payload';
  }
  if (!route.validate(copy)) {
    const error = route.validate.errors?.[0];
    return `${error?.instancePath || '/'}: ${error?.message || 'Invalid request'}`;
  }
}
