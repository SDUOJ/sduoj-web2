import { routerC, routerC_Contest_M, router_ProblemSet } from './routerC';
import { routerE } from './routerE';
import { getRouterPath, routerLayout } from './router';
import { routerM } from './routerM';
import { routerC_M } from './routerC';
import { duplicateRouteIds, duplicateRoutePaths } from './routeIntegrity';

describe('route tree integrity', () => {
  const routeSets = [
    ['layout', routerLayout],
    ['client', routerC],
    ['problem set', router_ProblemSet],
    ['contest menu', routerC_Contest_M],
    ['manage', routerM],
    ['exam', routerE],
  ] as const;

  it.each(routeSets)('%s has unique route paths and ids', (_name, routes) => {
    expect(duplicateRoutePaths(routes)).toEqual([]);
    expect(duplicateRouteIds(routes)).toEqual([]);
  });

  it('derives the client navigation from canonical client routes', () => {
    expect(routerC_M).toHaveLength(5);
    for (const menuRoute of routerC_M) {
      const canonical = routerC.find((route) => route.id === menuRoute.id);
      expect(canonical).toBeDefined();
      expect(menuRoute.path).toBe(canonical?.path);
      expect(menuRoute.exact).toBe(canonical?.exact);
      expect(menuRoute.component).toBe(canonical?.component);
    }
  });

  it('resolves typed route paths and returns an empty path for unknown ids', () => {
    expect(getRouterPath(routerE, 2)).toBe('/v2/exam/list');
    expect(getRouterPath(routerLayout, 999999)).toBe('');
  });
});
