export const AUTH_BOUNDARY_EVENT = 'sduoj-auth-boundary';

export function notifyAuthBoundary() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUTH_BOUNDARY_EVENT));
}
