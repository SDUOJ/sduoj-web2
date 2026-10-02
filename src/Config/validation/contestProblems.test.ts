import { contestProblemsError } from './contestProblems';

it('identifies every duplicate and its row positions despite aliases, spaces or case', () => {
  expect(
    contestProblemsError([
      { problemCode: 'SDUOJ-1806', problemTitle: 'A' },
      { problemCode: 'SDUOJ-1807' },
      { problemCode: ' sduoj-1806 ', problemTitle: 'B' },
      { problemCode: 'SDUOJ-1807' },
    ]),
  ).toBe(
    '比赛题目不能重复：SDUOJ-1806（第 1、3 行）；SDUOJ-1807（第 2、4 行）。请删除重复题目后再提交。',
  );
});

it('allows distinct codes and leaves incomplete rows to their existing field validation', () => {
  expect(
    contestProblemsError([{ problemCode: 'SDUOJ-1806' }, { problemCode: 'SDUOJ-1807' }]),
  ).toBeUndefined();
  expect(contestProblemsError([{}, { problemCode: '' }, { problemCode: ' ' }])).toBeUndefined();
  expect(contestProblemsError(undefined)).toBeUndefined();
});
