import { getDiffSecond, TimeDiff, TimeRangeState, unix2Date, unix2Time } from './Time';

describe('time adapters accept/reject matrix', () => {
  it.each([
    ['unix ms pair', 0, 3_600_000, 3600],
    ['unix second-like strings as ms', '0', '3600000', 3600],
    ['ISO strings', '2026-10-05T09:00:00+08:00', '2026-10-05T10:00:00+08:00', 3600],
    [
      'mixed ISO and unix',
      Date.parse('2026-10-05T09:00:00+08:00'),
      '2026-10-05T09:00:30+08:00',
      30,
    ],
  ])('getDiffSecond %s', (_label, start, end, expected) => {
    expect(getDiffSecond(start, end)).toBe(expected);
  });

  it('does not parseInt-truncate ISO strings into a year', () => {
    // regression: parseInt('2026-10-05…') === 2026 made every exam look like 0s
    expect(getDiffSecond('2026-10-05T09:00:00Z', '2026-10-05T11:00:00Z')).toBe(7200);
  });

  it.each([
    ['45 seconds', 0, 45_000, '45秒'],
    ['1 hour', 0, 3_600_000, '1时'],
    ['1h1m', 0, 3_660_000, '1时1分'],
    ['1d1h1m1s', 0, 90_061_000, '1天1时1分1秒'],
    ['zero', 0, 0, '0秒'],
  ])('TimeDiff renders duration %s', (_label, start, end, expected) => {
    expect(TimeDiff(start, end)).toBe(expected);
  });

  it.each([
    ['wait', () => Date.now() + 60_000, () => Date.now() + 120_000, 'wait'],
    ['end', () => 0, () => 1, 'end'],
    ['running', () => 0, () => Date.now() + 60_000, 'running'],
  ])('TimeRangeState %s', (_label, start, end, expected) => {
    expect(TimeRangeState(start(), end())).toBe(expected);
  });

  it('formats unix and ISO timestamps the same way', () => {
    const iso = '2026-10-05T12:34:56+08:00';
    const ms = Date.parse(iso);
    expect(unix2Time(iso)).toBe(unix2Time(ms));
    expect(unix2Date(iso)).toBe(unix2Date(ms));
    expect(unix2Date(ms)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
