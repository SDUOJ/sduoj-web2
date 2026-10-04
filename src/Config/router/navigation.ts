import type { IRouter } from './types';

export function materializeRoutePath(
  pattern: string,
  params: Readonly<Record<string, string | number>>,
) {
  return pattern.replace(/:([^/]+)/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined || value === '') throw new Error(`Missing route parameter: ${name}`);
    return encodeURIComponent(String(value));
  });
}

export function navigationLinks(
  routes: readonly IRouter[],
  params: Readonly<Record<string, string | number>>,
  order: readonly number[] = routes.map((route) => route.id),
) {
  return order.map((id) => {
    const route = routes.find((candidate) => candidate.id === id);
    if (!route) throw new Error(`Missing navigation route: ${id}`);
    return {
      key: route.navigationKey ?? String(route.id),
      name: route.title_i18n,
      pattern: route.path,
      link: materializeRoutePath(route.path, params),
    };
  });
}
