export type JudgeMessage = [
  id: string,
  version: number,
  checkpointType: number | null,
  checkpointIndex: number,
  checkpointId: number,
  result: number,
  score: number | null,
  time: number | null,
  memory: number | null,
];

function isJudgeMessage(value: unknown): value is JudgeMessage {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    typeof value[0] === 'string' &&
    [value[1], value[3], value[4], value[5]].every(
      (item) => typeof item === 'number' && Number.isFinite(item),
    ) &&
    (value[2] === null || (typeof value[2] === 'number' && Number.isFinite(value[2]))) &&
    value
      .slice(6)
      .every((item) => item === null || (typeof item === 'number' && Number.isFinite(item)))
  );
}

export function judgeMessages(raw: string): JudgeMessage[] {
  try {
    let data: unknown = JSON.parse(raw);
    // Redis pub/sub can wrap a live frame; cumulative frames contain an array of records.
    if (typeof data === 'string') data = JSON.parse(data);
    const rows = isJudgeMessage(data)
      ? [data]
      : Array.isArray(data)
        ? data.filter(isJudgeMessage)
        : [];
    const latest = new Map<string, number>();
    for (const row of rows) latest.set(row[0], Math.max(latest.get(row[0]) ?? -Infinity, row[1]));
    return rows.filter((row) => row[1] === latest.get(row[0]));
  } catch {
    return [];
  }
}
