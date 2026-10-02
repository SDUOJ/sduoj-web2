import { UrlPrefix } from '../Config/constValue';

export interface ReturnLocation {
  pathname: string;
  search?: string;
  hash?: string;
}

export function returnTo(location: ReturnLocation): string {
  const pathname = location.pathname || UrlPrefix + '/home';
  if (
    pathname === UrlPrefix + '/login' ||
    (pathname !== UrlPrefix && !pathname.startsWith(UrlPrefix + '/'))
  ) {
    return UrlPrefix + '/home';
  }
  return pathname + (location.search ?? '') + (location.hash ?? '');
}

export function loginRedirect(location: ReturnLocation): string {
  return `${UrlPrefix}/login?to=${encodeURIComponent(returnTo(location))}`;
}
