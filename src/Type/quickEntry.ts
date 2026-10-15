/** Shared by Java contests and Python problem sets; timestamps are Unix milliseconds. */
export interface QuickEntry {
  type: 'contest' | 'problemSet';
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  groupId: string | null;
  groupTitle: string | null;
  tag: string | null;
}

export interface QuickEntries {
  running: QuickEntry[];
  upcoming: QuickEntry[];
}

export function mergeQuickEntries(sources: QuickEntries[], now: number): QuickEntries {
  const entries = new Map<string, QuickEntry>();
  for (const source of sources) {
    for (const entry of [...source.running, ...source.upcoming]) {
      entries.set(`${entry.type}:${entry.id}`, entry);
    }
  }
  const running: QuickEntry[] = [];
  const upcoming: QuickEntry[] = [];
  for (const entry of Array.from(entries.values())) {
    const start = Number(entry.startTime);
    const end = Number(entry.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || end <= now) continue;
    if (start <= now) running.push(entry);
    else if (start <= now + 86400000) upcoming.push(entry);
  }
  const compare = (field: 'startTime' | 'endTime') => (a: QuickEntry, b: QuickEntry) =>
    Number(a[field]) - Number(b[field]) || `${a.type}:${a.id}`.localeCompare(`${b.type}:${b.id}`);
  return {
    running: running.sort(compare('endTime')),
    upcoming: upcoming.sort(compare('startTime')),
  };
}
