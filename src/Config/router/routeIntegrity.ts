import type { IBaseRouter, IRouter } from './types';

export type RouteNode = IBaseRouter | IRouter;

/** Flatten a menu route tree into renderable routes while preserving parent boundaries. */
export function flattenRoutesWithComponents(routes: readonly IBaseRouter[]): IBaseRouter[] {
  return routes.flatMap((route) => [
    ...(route.component ? [{ ...route, exact: route.children ? true : route.exact }] : []),
    ...(route.children ? flattenRoutesWithComponents(route.children) : []),
  ]);
}

/** Return all route nodes, including menu nodes that have children. */
export function flattenRouteTree(routes: readonly RouteNode[]): RouteNode[] {
  return routes.flatMap((route) => [
    route,
    ...('children' in route && route.children ? flattenRouteTree(route.children) : []),
  ]);
}

/** Normalize parameter names so two equivalent route patterns cannot drift apart. */
export function normalizeRoutePath(path: string): string {
  return path.replace(/:[^/]+/g, ':param');
}

export function duplicateRoutePaths(routes: readonly RouteNode[]): string[] {
  const counts = new Map<string, number>();
  for (const route of flattenRouteTree(routes)) {
    const path = normalizeRoutePath(route.path);
    counts.set(path, (counts.get(path) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([path]) => path);
}

export function duplicateRouteIds(routes: readonly RouteNode[]): number[] {
  const counts = new Map<number, number>();
  for (const route of flattenRouteTree(routes)) {
    counts.set(route.id, (counts.get(route.id) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}
