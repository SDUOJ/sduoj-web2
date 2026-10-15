import {
  JudgeMessage,
  MAX_JUDGE_FRAME_CHARACTERS,
  MAX_JUDGE_FRAME_RECORDS,
  parseJudgeFrame,
} from './judgeMessages';

const message: JudgeMessage = ['abc', 3, 0, 1, 0, 1, 10, 2, 1024];

it('supports legacy live, Redis-wrapped, and cumulative records', () => {
  for (const raw of [
    JSON.stringify(message),
    JSON.stringify(JSON.stringify(message)),
    JSON.stringify([message]),
  ]) {
    expect(parseJudgeFrame(raw).messages).toEqual([message]);
    expect(parseJudgeFrame(raw).rejection).toBeUndefined();
  }
  expect(parseJudgeFrame('[]')).toEqual({ messages: [], rejection: undefined });
});

it('rejects unsupported protocol envelopes and malformed records without invoking consumers', () => {
  expect(parseJudgeFrame(JSON.stringify({ protocol_version: 2, records: [message] }))).toEqual({
    messages: [],
    rejection: 'unsupported',
  });
  expect(parseJudgeFrame('{broken')).toEqual({ messages: [], rejection: 'malformed' });
  for (const record of [
    [...message, 'extra'],
    ['x'.repeat(257), ...message.slice(1)],
    [message[0], -1, ...message.slice(2)],
    [message[0], 3, 7, ...message.slice(3)],
    [message[0], 3.5, ...message.slice(2)],
    [message[0], 3, 0, 1000000, ...message.slice(4)],
  ]) {
    expect(parseJudgeFrame(JSON.stringify(record))).toEqual({
      messages: [],
      rejection: 'unsupported',
    });
  }
});

it('bounds raw frame size and cumulative record count', () => {
  expect(parseJudgeFrame(' '.repeat(MAX_JUDGE_FRAME_CHARACTERS + 1))).toEqual({
    messages: [],
    rejection: 'oversized',
  });
  expect(
    parseJudgeFrame(
      JSON.stringify(Array.from({ length: MAX_JUDGE_FRAME_RECORDS + 1 }, () => message)),
    ),
  ).toEqual({ messages: [], rejection: 'oversized' });
});

it('keeps valid records and the latest submission version when a cumulative frame contains malformed rows', () => {
  const older = [...message] as JudgeMessage;
  older[1] = 2;
  expect(parseJudgeFrame(JSON.stringify([null, older, message, ['broken']])).messages).toEqual([
    message,
  ]);
});

it('accepts task checkpoint types for Run and administrative tasks', () => {
  const rows = [
    ['run', 1, 3, 0, 0, -1, null, 10, 20],
    ['validation', 2, 4, 0, 0, 1, null, 10, 20],
  ];
  expect(parseJudgeFrame(JSON.stringify(rows)).messages).toEqual(rows);
});

it.each([-4, -3, -2])(
  'accepts real formal progress frames without a final result (%s)',
  (stage) => {
    const progress: JudgeMessage = ['c7870bf14801000', 0, null, stage, 0, null, null, null, null];
    for (const frame of [progress, JSON.stringify(progress), [progress]]) {
      expect(parseJudgeFrame(JSON.stringify(frame))).toEqual({
        messages: [progress],
        rejection: undefined,
      });
    }
  },
);

it('still rejects missing results on case and completion records', () => {
  for (const index of [0, -1]) {
    const frame = ['abc', 0, null, index, 0, null, null, null, null];
    expect(parseJudgeFrame(JSON.stringify(frame))).toEqual({
      messages: [],
      rejection: 'unsupported',
    });
  }
});
