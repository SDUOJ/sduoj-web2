import { contracts } from './contracts';
import database from './database.json';
import { constraintError, Constraint } from './constraints';

type Db = Record<string, Record<string, Record<string, [string, boolean, string | null]>>>;
const db = database as unknown as Db;

function columnType(scope: 'oj' | 'autolab', table: string, field: string) {
  return db[scope][table]?.[field]?.[0];
}

function sourceParts(source: string): { scope: 'oj' | 'autolab'; table: string; field: string } | null {
  const match = /(?:^|;\s*)(oj|autolab)\.([a-z0-9_]+)\.([a-zA-Z0-9_]+)/.exec(source);
  if (!match) return null;
  return { scope: match[1] as 'oj' | 'autolab', table: match[2], field: match[3] };
}

function collectConstraints(node: unknown, path: string[] = []): Array<{ path: string; rule: Constraint }> {
  if (!node || typeof node !== 'object') return [];
  const maybe = node as Constraint;
  if (typeof maybe.source === 'string' && maybe.source.length > 0) {
    return [{ path: path.join('.'), rule: maybe }];
  }
  const out: Array<{ path: string; rule: Constraint }> = [];
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    out.push(...collectConstraints(value, [...path, key]));
  }
  return out;
}

const entries = collectConstraints(contracts);

it('every sourced contract constraint maps to a real database column or a documented override', () => {
  const missing: string[] = [];
  for (const { path, rule } of entries) {
    const parsed = sourceParts(rule.source);
    if (!parsed) continue;
    const type = columnType(parsed.scope, parsed.table, parsed.field);
    if (!type) missing.push(`${path} -> ${parsed.scope}.${parsed.table}.${parsed.field}`);
  }
  expect(missing).toEqual([]);
});

it('string constraints never allow more UTF-16 units than the database column', () => {
  const tooLoose: string[] = [];
  for (const { path, rule } of entries) {
    const parsed = sourceParts(rule.source);
    if (!parsed) continue;
    const type = columnType(parsed.scope, parsed.table, parsed.field);
    if (!type) continue;
    const chars = /^(?:var)?char\((\d+)\)/.exec(type);
    if (!chars) continue;
    const limit = Number(chars[1]);
    // UTF-16 length is the MySQL varchar(n) budget in this schema.
    const declared = rule.maxUtf16 ?? rule.maxCharacters;
    if (declared !== undefined && declared > limit) {
      tooLoose.push(`${path}: frontend ${declared} > db ${limit}`);
    }
  }
  expect(tooLoose).toEqual([]);
});

it('integer constraints stay inside the database integer range', () => {
  const tooLoose: string[] = [];
  for (const { path, rule } of entries) {
    if (rule.kind !== 'integer') continue;
    const parsed = sourceParts(rule.source);
    if (!parsed) continue;
    const type = columnType(parsed.scope, parsed.table, parsed.field);
    if (!type) continue;
    const integer =
      /^(tinyint|smallint|mediumint|int|bigint)(?:\(\d+\))?( unsigned)?$/.exec(type);
    if (!integer) continue;
    const bits = { tinyint: 8, smallint: 16, mediumint: 24, int: 32, bigint: 64 }[integer[1] as 'int'];
    const unsigned = Boolean(integer[2]);
    const max = unsigned ? 2 ** bits - 1 : 2 ** (bits - 1) - 1;
    const min = unsigned ? 0 : -(2 ** (bits - 1));
    if (rule.max !== undefined && Number(rule.max) > max) {
      tooLoose.push(`${path}: frontend max ${rule.max} > db ${max}`);
    }
    if (rule.min !== undefined && Number(rule.min) < min) {
      tooLoose.push(`${path}: frontend min ${rule.min} < db ${min}`);
    }
  }
  expect(tooLoose).toEqual([]);
});

describe('late permission field matrix', () => {
  it('rejects blank username and out-of-range discount before any request', () => {
    expect(constraintError(contracts.late.username, '')).toBeDefined();
    expect(constraintError(contracts.late.username, '   ')).toBeDefined();
    expect(constraintError(contracts.late.discount, 0)).toBeDefined();
    expect(constraintError(contracts.late.discount, -0.1)).toBeDefined();
    expect(constraintError(contracts.late.discount, 1.01)).toBeDefined();
    expect(constraintError(contracts.late.discount, 0.01)).toBeUndefined();
    expect(constraintError(contracts.late.discount, 1)).toBeUndefined();
  });

  it('caps notes at 200 characters', () => {
    expect(constraintError(contracts.late.note, 'a'.repeat(200))).toBeUndefined();
    expect(constraintError(contracts.late.note, 'a'.repeat(201))).toBeDefined();
  });
});

describe('notice field matrix', () => {
  it('rejects blank title/body and overlong values', () => {
    expect(constraintError(contracts.notice.title, '')).toBeDefined();
    expect(constraintError(contracts.notice.title, '   ')).toBeDefined();
    expect(constraintError(contracts.notice.title, 'a'.repeat(46))).toBeDefined();
    expect(constraintError(contracts.notice.title, 'a'.repeat(45))).toBeUndefined();
    expect(constraintError(contracts.notice.text, '')).toBeDefined();
    expect(constraintError(contracts.notice.text, 'x'.repeat(20001))).toBeDefined();
    expect(constraintError(contracts.notice.text, 'x'.repeat(20000))).toBeUndefined();
  });
});

describe('user field matrix', () => {
  it('enforces username charset and admin password bounds', () => {
    expect(constraintError(contracts.user.username, 'ab')).toBeDefined();
    expect(constraintError(contracts.user.username, 'valid_user01')).toBeUndefined();
    expect(constraintError(contracts.user.adminPassword, 'abc')).toBeDefined();
    expect(constraintError(contracts.user.adminPassword, 'Abcd')).toBeUndefined();
  });
});
