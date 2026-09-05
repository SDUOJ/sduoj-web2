import { autolabFieldRules, autolabFieldSchema } from './fields';
import type { RuleObject } from 'antd/es/form';
import dayjs from 'dayjs';

function validate(
  model: Parameters<typeof autolabFieldRules>[0],
  path: Parameters<typeof autolabFieldRules>[1],
  value: unknown,
) {
  const rule = autolabFieldRules(model, path)[0] as RuleObject;
  return rule.validator!(rule, value, () => {});
}

it('resolves required and nullable Autolab fields from the generated schema', () => {
  expect(autolabFieldSchema('CourseCreateRequest', 'course_name').required).toBe(true);
  expect(autolabFieldSchema('CourseCreateRequest', 'c_ids').required).toBe(false);
  expect(autolabFieldSchema('CourseTimeItemAddRequest', 'course_content').schema).toHaveProperty(
    'anyOf.0.type',
    'string',
  );
});

it('turns generated Pydantic constraints into Ant Design rules', async () => {
  await expect(validate('CourseListRequest', 'page_size', 100)).resolves.toBeUndefined();
  await expect(validate('CourseListRequest', 'page_size', 101)).rejects.toThrow();
  await expect(validate('ClassroomCreateRequest', 'c_name', undefined)).rejects.toThrow();
});

it('validates nested rubric records and preserves the source value', async () => {
  const value = [{ name: 'Correctness', score: '5', answer: '4' }];
  await expect(validate('subjective_config', 'judgeConfig', value)).resolves.toBeUndefined();
  expect(value[0].score).toBe('5');
  await expect(validate('subjective_config', ['judgeConfig', 0, 'score'], 1.5)).rejects.toThrow();
  await expect(
    validate('subjective_config', 'judgeConfig', [{ name: 'Incomplete' }]),
  ).rejects.toThrow();
});

it('validates serialized picker values and nullable arrays without weakening required members', async () => {
  await expect(
    validate('CourseTimeItemAddRequest', 'start_time', dayjs('2026-09-05T10:00:00')),
  ).resolves.toBeUndefined();
  await expect(
    validate('CourseTimeItemAddRequest', 'start_time', dayjs('invalid')),
  ).rejects.toThrow();
  await expect(validate('CourseCreateRequest', 'c_ids', null)).resolves.toBeUndefined();
  await expect(validate('CourseCreateRequest', 'c_ids', [1.5])).rejects.toThrow();
  await expect(validate('timeSettingType', 'tm_end', undefined)).rejects.toThrow();
});
