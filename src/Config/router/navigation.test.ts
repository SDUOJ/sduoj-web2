import { materializeRoutePath, navigationLinks } from './navigation';
import { navigationTrees, routeTrees } from './routeTrees';
import { matchPath } from 'react-router-dom';
import { duplicateRoutePaths, duplicateRouteIds } from './routeIntegrity';
import { projectClientLayouts } from './layoutProjection';

it('uses one registry for every routed domain and navigation projection', () => {
  for (const routes of Object.values(routeTrees)) {
    expect(duplicateRoutePaths(routes)).toEqual([]);
    expect(duplicateRouteIds(routes)).toEqual([]);
  }
  expect(navigationTrees.manage).toBe(routeTrees.manage);
  expect(navigationTrees.contest).toBe(routeTrees.contest);
  expect(navigationTrees.problemSet).toBe(routeTrees.problemSet);
});

it('projects all client families including future routes without another path table', () => {
  const Component = () => null;
  const routes = projectClientLayouts(
    [...routeTrees.client, { id: 9800, path: '/v2/future/:id', component: Component }],
    '/v2',
    Component,
  );
  for (const client of routeTrees.client) {
    expect(
      routes.some((route) =>
        matchPath(client.path.replace(/:[^/]+/g, 'fixture'), {
          path: route.path,
          exact: route.exact,
        }),
      ),
    ).toBe(true);
  }
  expect(routes.find((route) => route.path === '/v2/future')?.component).toBe(Component);
  expect(routes.find((route) => route.path === '/v2/login')?.exact).toBe(true);
  expect(routes.find((route) => route.path === '/v2/problem')?.exact).toBe(false);
  expect(duplicateRoutePaths(routes)).toEqual([]);
  expect(() => projectClientLayouts([{ id: 1, path: '/outside' }], '/v2', Component)).toThrow(
    'Invalid client route',
  );
});

it('generates contest and problem-set links from the canonical patterns', () => {
  const contests = navigationLinks(
    navigationTrees.contest,
    { contestId: 17, problemCode: 'A/B' },
    [5, 1, 2, 3, 4],
  );
  expect(contests.map((route) => route.key)).toEqual([
    'register',
    'overview',
    'problem',
    'status',
    'rank',
  ]);
  expect(contests[2].link).toBe('/v2/contest/17/problem/A%2FB');
  const problemSets = navigationLinks(navigationTrees.problemSet, {
    problemSetId: 22,
    problemGroupId: 0,
    problemId: 0,
  });
  expect(problemSets.find((route) => route.key === 'problem')?.link).toBe(
    '/v2/problemSet/22/problem/0/0',
  );
  for (const link of [...contests, ...problemSets]) {
    expect(matchPath(link.link, { path: link.pattern, exact: true })).not.toBeNull();
  }
});

it('encodes route segments and fails closed when navigation metadata is invalid', () => {
  expect(materializeRoutePath('/course/:id', { id: 'a?b#c&d' })).toBe('/course/a%3Fb%23c%26d');
  expect(() => materializeRoutePath('/course/:id', {})).toThrow('Missing route parameter');
  expect(() => navigationLinks(navigationTrees.contest, { contestId: 1 }, [999])).toThrow(
    'Missing navigation route',
  );
});
