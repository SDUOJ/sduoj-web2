import { developmentFeaturesEnabled } from '../developmentFeatures';
import type { IBaseRouter } from './types';

/** Apply one availability rule to both navigation and routable pages, including whole subtrees. */
export function availableRoutes<T extends IBaseRouter>(
  routes: readonly T[],
  includeDevelopment = developmentFeaturesEnabled(),
): T[] {
  return routes.flatMap((route) => {
    if (route.devOnly && !includeDevelopment) return [];
    const children = route.children
      ? availableRoutes(route.children, includeDevelopment)
      : undefined;
    if (children?.length === 0 && !route.component) return [];
    return [{ ...route, ...(children ? { children } : {}) } as T];
  });
}
