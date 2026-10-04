import { routes as validators } from './generated/autolab-validators';
import spec from './autolab.json';

const routes = Object.keys(spec.routes).map((route) => {
  const [method, path] = route.split(' ');
  const pattern = path
    .split('/')
    .map((part) => (part.startsWith('{') ? '[^/]+' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return {
    method,
    pattern: new RegExp(`^${pattern}$`),
    validate: validators[route],
  };
});

export function autolabSchemaError(
  path: string,
  payload: unknown,
  method = 'POST',
): string | undefined {
  const route = routes.find((route) => route.method === method && route.pattern.test(path));
  if (!route) return;
  if (!route.validate) throw new Error(`Missing standalone validator: ${method} ${path}`);
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
