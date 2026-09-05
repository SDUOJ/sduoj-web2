import { initLanguage } from './initLanguage';
import judgeAuth from './judgeAhtu';
import { TimeRangeState, TimeDiff, getDiffSecond } from './Time';

describe('language selection', () => {
  it.each([
    ['zh-CN', 'zh'],
    ['en-US', 'en'],
    ['fr-FR', 'en'],
    ['ZH', 'zh'],
  ])('normalizes %s to the supported locale %s', (stored, expected) => {
    localStorage.setItem('language', stored);
    expect(initLanguage()).toBe(expected);
  });
});

describe('time boundaries', () => {
  beforeEach(() => jest.spyOn(Date, 'now').mockReturnValue(1000));
  it.each([
    [1001, 2000, 'wait'],
    [0, 999, 'end'],
    [1000, 2000, 'running'],
    [0, 1000, 'running'],
  ])('classifies the interval %s..%s as %s', (start, end, expected) =>
    expect(TimeRangeState(start, end)).toBe(expected),
  );
  it('accepts serialized timestamps and formats durations', () => {
    expect(TimeRangeState('0', '1000')).toBe('running');
    expect(getDiffSecond('1000', '62000')).toBe(61);
    expect(TimeDiff(0, 61000, 'd', 'h', 'm', 's')).toBe('1m1s');
    expect(TimeDiff(0, 0, 'd', 'h', 'm', 's')).toBe('0s');
  });
});

it('requires an explicitly matching role', () => {
  expect(judgeAuth(undefined, ['admin'])).toBe(false);
  expect(judgeAuth(['user'], ['admin', 'superadmin'])).toBe(false);
  expect(judgeAuth(['user', 'admin'], ['admin', 'superadmin'])).toBe(true);
});
