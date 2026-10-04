import { routerM } from './routerM';
import en from '../../Assert/lang/en.json';
import zh from '../../Assert/lang/zh.json';

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

it('translates AI business sidebar labels without changing route identities', () => {
  const english = en as unknown as Record<string, string>;
  const chinese = zh as unknown as Record<string, string>;
  const routes = routerM.flatMap((route) => [route, ...(route.children || [])]);
  const aiRoutes = routes.filter((route) => route.title_i18n?.startsWith('aiMenu'));
  expect(aiRoutes).toHaveLength(6);
  for (const route of aiRoutes) {
    const key = route.title_i18n!;
    expect(english[key]).toBeTruthy();
    expect(english[key]).not.toMatch(/[\u3400-\u9fff]/);
    expect(chinese[key]).toBeTruthy();
  }
});
