import { applyJudgeMessage, LiveSubmissionRow } from './submissionUpdates';

const checkpoint = ['abc', 2, 0, 3, 10, 1, 20, 4, 512] as const;

it('updates a checkpoint without mutating Redux-owned rows', () => {
  const row: LiveSubmissionRow = { submissionId: 'abc', result: '-2', score: 10 };
  const rows = Object.freeze([Object.freeze(row)]) as unknown as LiveSubmissionRow[];
  const update = applyJudgeMessage(rows, [...checkpoint]);

  expect(update.rows).not.toBe(rows);
  expect(update.rows[0]).not.toBe(row);
  expect(update.rows[0]).toMatchObject({ score: 30, RunningStep: 1 });
  expect(Array.from(update.rows[0].cur_cpt!)).toEqual(['0:3']);
});

it('does not count a replayed checkpoint twice after reconnect', () => {
  const first = applyJudgeMessage(
    [{ submissionId: 'abc', result: '-2', score: 10 }],
    [...checkpoint],
  );
  const replay = applyJudgeMessage(first.rows, [...checkpoint]);

  expect(replay.rows[0].score).toBe(30);
  expect(replay.rows[0].RunningStep).toBe(1);
  expect(replay.rows[0].cur_cpt).not.toBe(first.rows[0].cur_cpt);
});

it('records completion metadata and closes only after every row finishes', () => {
  const rows: LiveSubmissionRow[] = [
    { submissionId: 'abc', result: '-2', score: 0 },
    { submissionId: 'other', result: '1', score: 100 },
  ];
  const update = applyJudgeMessage(rows, ['abc', 7, null, -1, 0, 1, 100, 12, 1024]);

  expect(update.completed).toBe(true);
  expect(update.version).toEqual({ submissionId: 'abc', value: 7 });
  expect(update.rows[0]).toMatchObject({ result: 1, score: 100, usedTime: 12, usedMemory: 1024 });
});

it('counts private and public checkpoints with the same index separately', () => {
  const privateCase = applyJudgeMessage(
    [{ submissionId: 'abc', result: '-2', score: 0 }],
    ['abc', 3, 0, 0, 10, 1, 10, 1, 128],
  );
  const publicCase = applyJudgeMessage(privateCase.rows, ['abc', 3, 1, 0, 11, 1, 20, 2, 256]);

  expect(publicCase.rows[0]).toMatchObject({ score: 30, RunningStep: 2 });
  expect(Array.from(publicCase.rows[0].cur_cpt!)).toEqual(['0:0', '1:0']);
});

it('resets checkpoint progress for a newer rejudge version and ignores older frames', () => {
  const old = applyJudgeMessage(
    [{ submissionId: 'abc', result: '-2', score: 0 }],
    ['abc', 3, 0, 0, 10, 1, 10, 1, 128],
  );
  const reset = applyJudgeMessage(old.rows, ['abc', 4, null, -4, 0, 0, null, null, null]);
  const next = applyJudgeMessage(reset.rows, ['abc', 4, 1, 0, 11, 1, 7, 2, 256]);
  const stale = applyJudgeMessage(next.rows, ['abc', 3, 0, 1, 12, 1, 99, 3, 512]);

  expect(reset.rows[0]).toMatchObject({ score: 0, RunningStep: 0, liveVersion: 4 });
  expect(Array.from(reset.rows[0].cur_cpt!)).toEqual([]);
  expect(next.rows[0]).toMatchObject({ score: 7, RunningStep: 1 });
  expect(Array.from(next.rows[0].cur_cpt!)).toEqual(['1:0']);
  expect(stale.rows).toBe(next.rows);
});
