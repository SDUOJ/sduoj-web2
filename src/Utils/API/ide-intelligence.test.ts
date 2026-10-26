import ideApi from './ide-intelligence';
import { service } from './request';
jest.mock('./request', () => ({ service: { request: jest.fn() } }));
const send = jest.mocked(service.request);

afterEach(() => {
  jest.useRealTimers();
  send.mockReset();
});

test('all IDE calls share a 300ms gate and failures resolve quietly to null', async () => {
  jest.useFakeTimers();
  const starts: number[] = [];
  send.mockImplementation(async () => {
    starts.push(performance.now());
    return { data: { code: 0, data: null } } as any;
  });
  const calls = [ideApi.capabilities(), ideApi.close('one'), ideApi.close('two')];
  await jest.advanceTimersByTimeAsync(1000);
  expect(await Promise.all(calls)).toEqual([null, null, null]);
  expect(starts).toHaveLength(3);
  expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(300);
  expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(300);
  send.mockRejectedValueOnce(new Error('offline'));
  const failed = ideApi.close('one');
  await jest.advanceTimersByTimeAsync(1000);
  expect(await failed).toBeNull();
  send.mockResolvedValueOnce({ data: 'invalid response' } as any);
  const invalid = ideApi.capabilities();
  await jest.advanceTimersByTimeAsync(1000);
  expect(await invalid).toBeNull();
  send.mockRejectedValueOnce({ response: { status: 410 } });
  const expired = ideApi.definition('expired', { revision: 1, line: 1, column: 1 });
  await jest.advanceTimersByTimeAsync(1000);
  expect(await expired).toEqual({ expired: true });
  send.mockRejectedValueOnce({
    response: { status: 409, data: { detail: { serverRevision: 8 } } },
  });
  const conflict = ideApi.sync('one', { baseRevision: 1, revision: 2, code: 'x=2' });
  await jest.advanceTimersByTimeAsync(1000);
  expect(await conflict).toEqual({ conflict: true, revision: 8 });
});

test('drops a cancelled completion before consuming the HTTP interval or sending it', async () => {
  jest.useFakeTimers();
  send.mockResolvedValue({ data: { code: 0, data: null } } as any);
  let valid = true;
  const first = ideApi.close('before');
  const stale = ideApi.completion('sid', { revision: 1, line: 1, column: 2 }, () => valid);
  const latest = ideApi.completion('sid', { revision: 1, line: 1, column: 4 });
  await jest.advanceTimersByTimeAsync(100);
  valid = false;
  await jest.advanceTimersByTimeAsync(20000);
  await Promise.all([first, stale, latest]);
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[1][0]).toMatchObject({ data: { column: 4 } });
});
