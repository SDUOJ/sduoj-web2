import { autolabSchemaError } from './autolab';
import { requestConstraintError } from './requests';
import spec from './autolab.json';

it('loads a request contract for every exported JSON endpoint', () => {
  expect(Object.keys(spec.routes).length).toBeGreaterThan(70);
  expect(Object.keys(spec.routes).filter((route) => route.includes('/auto-task/ai/')).length).toBe(
    62,
  );
  for (const route of Object.keys(spec.routes)) {
    const path = route.split(' ')[1].replace(/\{[^}]+\}/g, '1');
    expect(() => autolabSchemaError(path, {}, route.split(' ')[0])).not.toThrow();
  }
});

it('enforces Pydantic required fields and page-size limits', () => {
  expect(autolabSchemaError('/ps/class/create', { c_name: 'Room' })).toBeDefined();
  expect(autolabSchemaError('/ps/course/list', { page_now: 1, page_size: 101 })).toBeDefined();
  expect(autolabSchemaError('/ps/course/list', { page_now: 1, page_size: 100 })).toBeUndefined();
});

it('preserves Pydantic nullable fields and does not coerce the submitted object', () => {
  const payload = { course_name: 'Course', tag: '实验', group_id: '84', c_ids: null };
  expect(autolabSchemaError('/ps/course/create', payload)).toBeUndefined();
  expect(payload.group_id).toBe('84');
  expect(payload.c_ids).toBeNull();
});

it('validates nested rubric fields and datetime values', () => {
  expect(
    autolabSchemaError('/ps/subjective/add', {
      type: 1,
      config: { judgeConfig: [{ name: 'Rubric', score: 'bad', answer: 'Answer' }] },
      description: 'Question',
    }),
  ).toBeDefined();
  expect(
    autolabSchemaError('/ps/course/1/times/add', {
      start_time: 'not-a-date',
      end_time: '2026-09-06T10:00:00Z',
    }),
  ).toBeDefined();
});

it('retains backend trimming before applying storage limits', () => {
  expect(
    requestConstraintError('/ps/class/create', {
      c_name: ` ${'a'.repeat(50)} `,
      address: 'Room',
      c_seat_num: 1,
    }),
  ).toBeUndefined();
});
