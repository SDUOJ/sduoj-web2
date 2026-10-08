import { act, renderHook } from '@testing-library/react';
import cApi from '../../Utils/API/c-api';
import { normalizeRankRows, readContestLikes, useContestRankRows, writeContestLikes } from './Rank';

jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: { getRank: jest.fn() },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

it('copies and sorts submission rows without mutating the API response', () => {
  const submissions = Object.freeze([Object.freeze([1, '20']), Object.freeze([1, '10'])]);
  const rows = Object.freeze([
    Object.freeze({ username: 'alice', submissions }),
  ]) as unknown as any[];

  const normalized = normalizeRankRows(rows);
  expect(normalized[0].submissions.map((item: any[]) => item[1])).toEqual(['10', '20']);
  expect(rows[0].submissions).toBe(submissions);
  expect(rows[0].submissions.map((item: any[]) => item[1])).toEqual(['20', '10']);
});

it('tolerates rank rows that have neither submissions nor problemResults', () => {
  const rows = Object.freeze([
    Object.freeze({ username: 'bob', submissions: null, problemResults: null }),
  ]) as unknown as any[];
  const normalized = normalizeRankRows(rows);
  expect(normalized[0].username).toBe('bob');
  expect(normalized[0].submissions).toBeNull();
});

it('ignores a stale contest response after navigation', async () => {
  const first = deferred<any[]>();
  const second = deferred<any[]>();
  jest.mocked(cApi.getRank).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const setAllow = jest.fn();
  const view = renderHook(({ contestId }) => useContestRankRows(contestId, 'running', setAllow), {
    initialProps: { contestId: '1' },
  });

  view.rerender({ contestId: '2' });
  await act(async () => second.resolve([{ username: 'new', submissions: [] }]));
  expect(view.result.current?.[0].username).toBe('new');
  await act(async () => first.resolve([{ username: 'old', submissions: [] }]));
  expect(view.result.current?.[0].username).toBe('new');
});

it('isolates stored likes by contest and removes an empty preference', () => {
  writeContestLikes(localStorage, '1', ['alice']);
  writeContestLikes(localStorage, '2', ['bob']);
  expect(readContestLikes(localStorage, '1')).toEqual(['alice']);
  expect(readContestLikes(localStorage, '2')).toEqual(['bob']);

  writeContestLikes(localStorage, '1', []);
  expect(readContestLikes(localStorage, '1')).toEqual([]);
  expect(localStorage.getItem('contest-like-1')).toBeNull();
});
