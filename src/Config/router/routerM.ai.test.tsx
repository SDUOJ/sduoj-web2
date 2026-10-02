import { routerM } from './routerM';

it('places tools in business navigation without a separate AI menu or bank', () => {
  expect(routerM.some((route) => route.path === '/v2/ai')).toBe(false);
  const paths = routerM.flatMap((route) => route.children || [route]).map((route) => route.path);
  expect(paths).toEqual(
    expect.arrayContaining([
      '/v2/manage/problemSet/problem_group',
      '/v2/manage/intelligent',
      '/v2/manage/problemSet/grading',
      '/v2/manage/problemSet/exams',
      '/v2/manage/problemSet/plagiarism',
      '/v2/manage/settings/assistant',
    ]),
  );
  expect(paths.some((path) => path.includes('/ai-bank'))).toBe(false);
});
