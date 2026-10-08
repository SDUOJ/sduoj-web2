import { autolabFieldRules, autolabFieldSchema } from './fields';
import type { RuleObject } from 'antd/es/form';

function validate(
  model: Parameters<typeof autolabFieldRules>[0],
  path: Parameters<typeof autolabFieldRules>[1],
  value: unknown,
) {
  const rule = autolabFieldRules(model, path)[0] as RuleObject;
  return rule.validator!(rule, value, () => {});
}

describe('autolab field rules accept/reject matrix', () => {
  it.each([
    ['CourseCreateRequest.course_name', 'CourseCreateRequest', 'course_name', 'Lab A', true],
    ['CourseListRequest.page_size boundary', 'CourseListRequest', 'page_size', 100, true],
    ['CourseListRequest.page_size over', 'CourseListRequest', 'page_size', 101, false],
    ['CourseListRequest.page_size non-numeric', 'CourseListRequest', 'page_size', 'many', false],
    ['ClassroomCreateRequest.c_name missing', 'ClassroomCreateRequest', 'c_name', undefined, false],
    ['ClassroomCreateRequest.c_name ok', 'ClassroomCreateRequest', 'c_name', 'A-101', true],
  ])('%s', async (_label, model, path, value, shouldPass) => {
    const validateModel = () => validate(model as any, path, value);
    if (shouldPass) await expect(validateModel()).resolves.toBeUndefined();
    else await expect(validateModel()).rejects.toThrow();
  });

  it('rejects unknown model fields instead of silently allowing them', () => {
    expect(() => autolabFieldSchema('CourseCreateRequest', 'not_a_field')).toThrow(/Unknown field/);
  });

  it.each([
    ['integer score', 5, true],
    ['float score', 1.5, false],
    ['string numeric score', '5', true],
  ])('subjective_config.judgeConfig score %s', async (_label, score, shouldPass) => {
    const value = [{ name: 'Correctness', score, answer: 4 }];
    if (shouldPass)
      await expect(validate('subjective_config', 'judgeConfig', value)).resolves.toBeUndefined();
    else await expect(validate('subjective_config', 'judgeConfig', value)).rejects.toThrow();
  });
});
