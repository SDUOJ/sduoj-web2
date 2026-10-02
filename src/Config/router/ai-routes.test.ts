import { routerLayout } from './router';
import { routerC } from './routerC';

it('retains old links only as compatibility routes and registers C-domain tools', () => {
  const oldRoutes = routerLayout.filter((route) => route.path.startsWith('/v2/ai-'));
  expect(oldRoutes).toHaveLength(10);
  expect(oldRoutes.every((route) => route.component && route.exact)).toBe(true);
  expect(routerC.map((route) => route.path)).toEqual(
    expect.arrayContaining([
      '/v2/workspace',
      '/v2/courses/knowledge',
      '/v2/practice/interviews',
      '/v2/account/assistant',
    ]),
  );
});
