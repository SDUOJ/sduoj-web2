export function positiveIntParam(search: string | undefined, key: string): number | undefined {
  const raw = new URLSearchParams(search || '').get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

export function textParam(search: string | undefined, key: string): string | undefined {
  const value = new URLSearchParams(search || '').get(key)?.trim();
  return value || undefined;
}
