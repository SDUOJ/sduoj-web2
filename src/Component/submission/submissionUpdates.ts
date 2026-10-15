import { JudgeMessage } from './judgeMessages';

export interface LiveSubmissionRow {
  submissionId: string;
  result: string | number;
  score: number;
  RunningStep?: number;
  cur_cpt?: Set<string>;
  liveVersion?: number;
  liveComplete?: boolean;
  usedTime?: number;
  usedMemory?: number;
}

export interface SubmissionUpdate {
  rows: LiveSubmissionRow[];
  completed: boolean;
  version?: { submissionId: string; value: number };
}

export const applyJudgeMessage = (
  rows: LiveSubmissionRow[],
  message: JudgeMessage,
): SubmissionUpdate => {
  const [
    submissionId,
    submissionVersion,
    checkpointType,
    checkpointIndex,
    ,
    judgeResult,
    score,
    time,
    memory,
  ] = message;
  const index = rows.findIndex((row) => row.submissionId === submissionId);
  if (index === -1) return { rows, completed: false };

  const previous = rows[index];
  if (previous.liveVersion !== undefined && submissionVersion < previous.liveVersion) {
    return { rows, completed: false };
  }
  const isNewVersion =
    previous.liveVersion !== undefined && submissionVersion > previous.liveVersion;
  const current = isNewVersion
    ? { ...previous, score: 0, RunningStep: 0, liveComplete: false, cur_cpt: new Set<string>() }
    : previous;
  let next: LiveSubmissionRow;
  let version: SubmissionUpdate['version'];
  if (checkpointIndex < 0) {
    next = { ...current, result: checkpointIndex.toString(), liveVersion: submissionVersion };
    if (checkpointIndex === -1 && judgeResult !== null) {
      next = {
        ...next,
        result: judgeResult,
        liveComplete: true,
        score: score ?? current.score,
        usedTime: time ?? current.usedTime,
        usedMemory: memory ?? current.usedMemory,
      };
      version = { submissionId, value: submissionVersion };
    }
  } else {
    const checkpoints = new Set(current.cur_cpt ?? []);
    const checkpointKey = `${checkpointType ?? 'unknown'}:${checkpointIndex}`;
    const isReplay = checkpoints.has(checkpointKey);
    checkpoints.add(checkpointKey);
    next = {
      ...current,
      cur_cpt: checkpoints,
      RunningStep: checkpoints.size,
      score: current.score + (isReplay ? 0 : (score ?? 0)),
      liveVersion: submissionVersion,
    };
  }

  const updated = [...rows];
  updated[index] = next;
  return {
    rows: updated,
    completed: updated.every(
      (row) => row.liveComplete === true || Number.parseInt(String(row.result), 10) > 0,
    ),
    version,
  };
};
