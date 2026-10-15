export type JudgeMessage = [
  id: string,
  version: number,
  checkpointType: number | null,
  checkpointIndex: number,
  checkpointId: number,
  result: number | null,
  score: number | null,
  time: number | null,
  memory: number | null,
];

export const MAX_JUDGE_FRAME_CHARACTERS = 1024 * 1024;
export const MAX_JUDGE_FRAME_RECORDS = 10000;
export type JudgeFrameRejection = 'oversized' | 'malformed' | 'unsupported';

function isJudgeMessage(value: unknown): value is JudgeMessage {
  return (
    Array.isArray(value) &&
    value.length === 9 &&
    typeof value[0] === 'string' &&
    value[0].length > 0 &&
    value[0].length <= 256 &&
    [value[1], value[3], value[4]].every(
      (item) => typeof item === 'number' && Number.isSafeInteger(item),
    ) &&
    value[1] >= 0 &&
    value[3] >= -10 &&
    value[3] < MAX_JUDGE_FRAME_RECORDS &&
    // Queue/compile/run notifications precede a result. Case and completion frames require one.
    ((value[5] === null && value[3] < -1) ||
      (typeof value[5] === 'number' && Number.isSafeInteger(value[5]))) &&
    (value[2] === null || value[2] === 0 || value[2] === 1 || value[2] === 3 || value[2] === 4) &&
    value
      .slice(6)
      .every((item) => item === null || (typeof item === 'number' && Number.isFinite(item)))
  );
}

export function parseJudgeFrame(raw: string): {
  messages: JudgeMessage[];
  rejection?: JudgeFrameRejection;
} {
  if (raw.length > MAX_JUDGE_FRAME_CHARACTERS) return { messages: [], rejection: 'oversized' };
  try {
    let data: unknown = JSON.parse(raw);
    // Redis pub/sub can wrap a live frame; cumulative frames contain an array of records.
    if (typeof data === 'string') data = JSON.parse(data);
    if (Array.isArray(data) && data.length > MAX_JUDGE_FRAME_RECORDS)
      return { messages: [], rejection: 'oversized' };
    if (!isJudgeMessage(data) && !Array.isArray(data))
      return { messages: [], rejection: 'unsupported' };
    const rows = isJudgeMessage(data)
      ? [data]
      : Array.isArray(data)
        ? data.filter(isJudgeMessage)
        : [];
    const latest = new Map<string, number>();
    for (const row of rows) latest.set(row[0], Math.max(latest.get(row[0]) ?? -Infinity, row[1]));
    return {
      messages: rows.filter((row) => row[1] === latest.get(row[0])),
      rejection:
        Array.isArray(data) && rows.length === 0 && data.length > 0 ? 'unsupported' : undefined,
    };
  } catch {
    return { messages: [], rejection: 'malformed' };
  }
}

export function judgeMessages(raw: string): JudgeMessage[] {
  return parseJudgeFrame(raw).messages;
}
