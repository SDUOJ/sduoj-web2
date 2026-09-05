import type { Rule } from 'antd/es/form';
import i18n from '../i18n';
import database from './database.json';

export interface Constraint {
  source: string;
  kind?: 'string' | 'integer' | 'number' | 'array' | 'json';
  required?: boolean;
  notBlank?: boolean;
  trim?: boolean;
  maxUtf16?: number;
  minUtf16?: number;
  maxCharacters?: number;
  maxBytes?: number;
  min?: number | string;
  max?: number | string;
  exclusiveMin?: number;
  maxItems?: number;
  minItems?: number;
  pattern?: RegExp;
  values?: readonly (string | number | boolean)[];
  utf8mb3?: boolean;
  serialize?: 'json' | 'comma';
  items?: Constraint;
}

type Database = Record<string, Record<string, Record<string, [string, boolean, string | null]>>>;
const metadata = database as unknown as Database;
const widths: Record<string, number> = {
  tinyint: 8,
  smallint: 16,
  mediumint: 24,
  int: 32,
  bigint: 64,
};
const byteLimits: Record<string, number> = {
  tinytext: 255,
  text: 65535,
  mediumtext: 16777215,
  longtext: 4294967295,
};

export function column(
  scope: 'oj' | 'autolab',
  table: string,
  field: string,
  override: Partial<Constraint> = {},
): Constraint {
  const entry = metadata[scope][table]?.[field];
  if (!entry) throw new Error(`Missing database column: ${scope}.${table}.${field}`);
  const [type, , charset] = entry;
  let base: Constraint = { source: `${scope}.${table}.${field}`, utf8mb3: charset === 'utf8mb3' };
  const chars = /^(?:var)?char\((\d+)\)/.exec(type);
  const integer = /^(tinyint|smallint|mediumint|int|bigint)(?:\(\d+\))?( unsigned)?$/.exec(type);
  if (chars) base = { ...base, kind: 'string', maxCharacters: Number(chars[1]) };
  else if (byteLimits[type]) base = { ...base, kind: 'string', maxBytes: byteLimits[type] };
  else if (integer) {
    const bits = widths[integer[1]];
    const unsigned = Boolean(integer[2]);
    const range = BigInt(2 ** (bits - (unsigned ? 0 : 1)));
    base = {
      ...base,
      kind: 'integer',
      min: unsigned ? '0' : String(-range),
      max: String(range - BigInt(1)),
    };
  } else if (type === 'float' || type === 'double') {
    const max = type === 'float' ? 3.4028234663852886e38 : Number.MAX_VALUE;
    base = { ...base, kind: 'number', min: -max, max };
  }
  return {
    ...base,
    ...override,
    source: override.source ? `${base.source}; ${override.source}` : base.source,
  };
}

function text(key: string, values: Record<string, unknown> = {}) {
  return String(i18n.t(key, values));
}

export function constraintError(rule: Constraint, input: unknown): string | undefined {
  if (input === undefined || input === null)
    return rule.required ? text('ValidationRequired') : undefined;
  let value = input;
  if (rule.trim && typeof value === 'string') value = value.trim();
  if (rule.notBlank && (typeof value !== 'string' || value.trim() === ''))
    return text('ValidationRequired');
  const enumValue =
    typeof value === 'string' && (rule.kind === 'integer' || rule.kind === 'number')
      ? Number(value)
      : value;
  if (rule.values && !rule.values.some((allowed) => allowed === enumValue))
    return text('ValidationEnum', { values: rule.values.join(', ') });
  if (rule.kind === 'integer') {
    if (typeof value === 'string' && value.trim() === '' && !rule.required) return;
    if (
      (typeof value !== 'string' && typeof value !== 'number') ||
      !/^[+-]?\d+$/.test(String(value).trim()) ||
      (typeof value === 'number' && !Number.isSafeInteger(value))
    )
      return text('ValidationInteger');
    const number = BigInt(String(value).trim());
    if (rule.min !== undefined && number < BigInt(rule.min))
      return text('ValidationMin', { min: rule.min });
    if (rule.max !== undefined && number > BigInt(rule.max))
      return text('ValidationMax', { max: rule.max });
  } else if (rule.kind === 'number') {
    if (typeof value === 'string' && value.trim() === '' && !rule.required) return;
    const number = typeof value === 'string' ? Number(value) : value;
    if (typeof number !== 'number' || !Number.isFinite(number)) return text('ValidationNumber');
    if (rule.min !== undefined && number < Number(rule.min))
      return text('ValidationMin', { min: rule.min });
    if (rule.max !== undefined && number > Number(rule.max))
      return text('ValidationMax', { max: rule.max });
    if (rule.exclusiveMin !== undefined && number <= rule.exclusiveMin)
      return text('ValidationExclusiveMin', { min: rule.exclusiveMin });
  } else if (rule.kind === 'array') {
    if (!Array.isArray(value)) return text('ValidationArray');
    if (rule.minItems !== undefined && value.length < rule.minItems)
      return text('ValidationMinItems', { min: rule.minItems });
    if (rule.maxItems !== undefined && value.length > rule.maxItems)
      return text('ValidationMaxItems', { max: rule.maxItems });
    if (rule.items) {
      for (const item of value) {
        const error = constraintError(rule.items, item);
        if (error) return error;
      }
    }
  } else if (rule.kind === 'string' && typeof value !== 'string') return text('ValidationString');

  if (rule.kind === 'json' || rule.serialize === 'json') {
    try {
      value = JSON.stringify(value);
    } catch {
      return text('ValidationJSON');
    }
  } else if (rule.serialize === 'comma' && Array.isArray(value)) {
    value = value.join(',');
  }
  if (typeof value === 'string') {
    if (rule.maxUtf16 !== undefined && value.length > rule.maxUtf16)
      return text('ValidationUtf16', { max: rule.maxUtf16 });
    if (rule.minUtf16 !== undefined && value.length < rule.minUtf16)
      return text('ValidationMinCharacters', { min: rule.minUtf16 });
    if (rule.maxCharacters !== undefined && Array.from(value).length > rule.maxCharacters)
      return text('ValidationCharacters', { max: rule.maxCharacters });
    if (rule.maxBytes !== undefined && new Blob([value]).size > rule.maxBytes)
      return text('ValidationBytes', { max: rule.maxBytes });
    if (rule.utf8mb3 && Array.from(value).some((char) => char.codePointAt(0)! > 0xffff))
      return text('ValidationUtf8mb3');
    if (rule.pattern && !rule.pattern.test(value)) return text('ValidationPattern');
  }
}

export function constraintRules(
  constraint: Constraint,
  transform?: (value: unknown) => unknown,
): Rule[] {
  return [
    {
      required: constraint.required,
      validator: async (_, value) => {
        const error = constraintError(constraint, transform ? transform(value) : value);
        if (error) throw new Error(error);
      },
    },
  ];
}

export function numericProps(constraint: Constraint) {
  return {
    min: constraint.min === undefined ? undefined : Number(constraint.min),
    max: constraint.max === undefined ? undefined : Number(constraint.max),
    precision: constraint.kind === 'integer' ? 0 : undefined,
  };
}
