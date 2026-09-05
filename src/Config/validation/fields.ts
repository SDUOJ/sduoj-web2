import type { Rule } from 'antd/es/form';
import type { AnySchema } from 'ajv';
import spec from './autolab.json';
import { ajv, externalReferences } from './autolab';
import i18n from '../i18n';

interface Schema {
  $ref?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  anyOf?: Schema[];
  allOf?: Schema[];
  items?: Schema;
  type?: string;
}
export type AutolabModel = keyof typeof spec.components.schemas;
const schemas: Record<string, Schema> = spec.components.schemas;

function resolve(schema: Schema): Schema {
  if (schema.$ref) return resolve(schemas[schema.$ref.split('/').pop()!] ?? {});
  if (schema.allOf?.length === 1) return resolve(schema.allOf[0]);
  if (schema.anyOf) return resolve(schema.anyOf.find((option) => option.type !== 'null') ?? {});
  return schema;
}

export function autolabFieldSchema(
  model: AutolabModel,
  path: string | readonly (string | number)[],
) {
  if (typeof path === 'string') path = [path];
  let schema = schemas[model];
  let required = false;
  for (const part of path) {
    const parent = resolve(schema);
    if (typeof part === 'number' || part === '*') {
      if (!parent.items) throw new Error(`Not an array: ${model}.${path.join('.')}`);
      schema = parent.items;
      required = true;
    } else {
      if (!parent.properties?.[part]) throw new Error(`Unknown field: ${model}.${path.join('.')}`);
      schema = parent.properties[part];
      required = parent.required?.includes(part) ?? false;
    }
  }
  return { schema, required };
}

export function autolabFieldRules(
  model: AutolabModel,
  path: string | readonly (string | number)[],
  transform?: (value: unknown) => unknown,
): Rule[] {
  const { schema, required } = autolabFieldSchema(model, typeof path === 'string' ? [path] : path);
  const validate = ajv.compile({
    type: 'object',
    properties: { value: externalReferences(schema) },
    ...(required ? { required: ['value'] } : {}),
  } as AnySchema);
  return [
    {
      required,
      validator: async (_, value) => {
        const transformed = transform ? transform(value) : value;
        let copy: unknown;
        try {
          copy = JSON.parse(JSON.stringify({ value: transformed }));
        } catch {
          throw new Error(String(i18n.t('ValidationJSON')));
        }
        if (!validate(copy)) {
          const error = validate.errors?.[0];
          throw new Error(
            error?.keyword === 'required'
              ? String(i18n.t('ValidationRequired'))
              : `${error?.instancePath ?? ''}: ${error?.message}`,
          );
        }
      },
    },
  ];
}
