import type { IBaseRouter, RouteComponent } from './types';

export function projectClientLayouts(
  routes: readonly IBaseRouter[],
  prefix: string,
  component: RouteComponent,
): IBaseRouter[] {
  const layouts = new Map<string, IBaseRouter>();
  for (const route of routes) {
    if (!route.path.startsWith(prefix + '/'))
      throw new Error(`Invalid client route: ${route.path}`);
    const segment = route.path.slice(prefix.length + 1).split('/')[0];
    if (!segment || segment.startsWith(':')) throw new Error(`Invalid client root: ${route.path}`);
    const path = `${prefix}/${segment}`;
    const previous = layouts.get(path);
    const exact = route.path === path && route.exact === true;
    layouts.set(path, {
      id: previous?.id ?? 10000 + route.id,
      path,
      exact: previous ? previous.exact === true && exact : exact,
      component,
    });
  }
  return Array.from(layouts.values());
}
