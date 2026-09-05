import { column, constraintError } from './constraints';
import { contracts } from './contracts';

describe('backend and database boundaries', () => {
  const fields = Object.entries(contracts).flatMap(([group, fields]) =>
    Object.entries(fields).map(([field, rule]) => ({ name: `${group}.${field}`, rule })),
  );
  for (const { name, rule } of fields) {
    const limits = [rule.maxCharacters, rule.maxUtf16, rule.maxBytes].filter(
      (value): value is number => value !== undefined,
    );
    if (rule.kind !== 'string' || rule.values || !limits.length) continue;
    const max = Math.min(...limits);
    if (max > 65535) continue;
    it(`${name} accepts its ASCII boundary and rejects one character more`, () => {
      expect(constraintError(rule, 'a'.repeat(max))).toBeUndefined();
      expect(constraintError(rule, 'a'.repeat(max + 1))).toBeDefined();
    });
  }

  it('distinguishes SQL characters, Java UTF-16 units and UTF-8 bytes', () => {
    expect(constraintError(contracts.description.title, '😀'.repeat(16))).toBeUndefined();
    expect(constraintError(contracts.description.title, '😀'.repeat(17))).toBeDefined();
    expect(constraintError(contracts.user.nickname, '😀'.repeat(15))).toBeUndefined();
    expect(constraintError(contracts.user.nickname, '😀'.repeat(16))).toBeDefined();
    expect(
      constraintError(contracts.description.markdownDescription, '中'.repeat(21845)),
    ).toBeUndefined();
    expect(
      constraintError(contracts.description.markdownDescription, '中'.repeat(21846)),
    ).toBeDefined();
    expect(constraintError(contracts.contest.questionMessage, '😀')).toBeDefined();
  });

  it('applies the backend trimmed length for late notes without changing the draft', () => {
    const value = `  ${'中'.repeat(200)}  `;
    expect(constraintError(contracts.late.note, value)).toBeUndefined();
    expect(value.length).toBe(204);
    expect(constraintError(contracts.late.note, '中'.repeat(201))).toBeDefined();
  });

  it('intersects unsigned storage with Java Integer limits', () => {
    expect(constraintError(contracts.problem.timeLimit, '2147483647')).toBeUndefined();
    expect(constraintError(contracts.problem.timeLimit, '2147483648')).toBeDefined();
    expect(constraintError(contracts.problem.timeLimit, -1)).toBeDefined();
    expect(constraintError(contracts.problem.timeLimit, 0)).toBeUndefined();
    expect(constraintError(contracts.problem.timeLimit, '1.5')).toBeDefined();
    expect(constraintError(contracts.problem.timeLimit, '0x10')).toBeDefined();
  });

  it('preserves exact BIGINT string boundaries', () => {
    const id = column('oj', 'oj_user', 'u_id');
    expect(constraintError(id, '18446744073709551615')).toBeUndefined();
    expect(constraintError(id, '18446744073709551616')).toBeDefined();
    expect(constraintError(id, Number.MAX_SAFE_INTEGER + 1)).toBeDefined();
  });

  it('does not confuse plaintext passwords with stored hashes', () => {
    expect(constraintError(contracts.user.newPassword, 'Aa1!'.repeat(100))).toBeUndefined();
    expect(constraintError(contracts.user.newPassword, 'abcdefgh')).toBeDefined();
    expect(constraintError(contracts.user.adminPassword, 'weak')).toBeUndefined();
    expect(constraintError(contracts.user.adminPassword, 'a'.repeat(33))).toBeDefined();
    expect(constraintError(contracts.user.currentPassword, 'x')).toBeUndefined();
  });

  it('preserves optional values and distinguishes missing text from blank restrictions', () => {
    expect(constraintError(contracts.group.description, undefined)).toBeUndefined();
    expect(constraintError(contracts.group.description, '')).toBeUndefined();
    expect(constraintError(contracts.classroom.c_name, '   ')).toBeDefined();
    expect(constraintError(contracts.classroom.c_seat_num, 0)).toBeDefined();
  });

  it('checks exclusive float bounds, enums, item counts and serialization size', () => {
    expect(constraintError(contracts.late.discount, 0)).toBeDefined();
    expect(constraintError(contracts.late.discount, 0.001)).toBeUndefined();
    expect(constraintError(contracts.late.discount, 1)).toBeUndefined();
    expect(constraintError(contracts.late.discount, Infinity)).toBeDefined();
    expect(constraintError(contracts.course.tag, '实验')).toBeUndefined();
    expect(constraintError(contracts.course.tag, 'Other')).toBeDefined();
    expect(constraintError(contracts.problem.judgeTemplates, Array(21).fill(1))).toBeDefined();
    expect(
      constraintError(contracts.problem.checkerConfig, { source: 'a'.repeat(65535) }),
    ).toBeDefined();
  });
});
