import debugApi from './ide-debug';
import { service } from './request';
jest.mock('./request', () => ({ service: { request: jest.fn() } }));
const send = jest.mocked(service.request);
afterEach(() => {
  jest.useRealTimers();
  send.mockReset();
});
test('debug requests share a 300ms start gate without a long poll blocking stop', async () => {
  jest.useFakeTimers();
  const starts: number[] = [];
  send.mockImplementation(async (request) => {
    starts.push(performance.now());
    if (request.url?.endsWith('/events')) return new Promise(() => undefined);
    return { data: { code: 0, data: null } } as any;
  });
  void debugApi.events('scene', 0);
  const capability = debugApi.capabilities();
  await jest.advanceTimersByTimeAsync(1000);
  expect((await capability).data).toBeNull();
  expect(starts).toHaveLength(2);
  expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(300);
  send.mockRejectedValueOnce(new Error('offline'));
  const failed = debugApi.current();
  await jest.advanceTimersByTimeAsync(1000);
  expect((await failed).data).toBeNull();
});

test('poll state token observes busy-only updates without replaying the event cursor', async () => {
  jest.useFakeTimers();
  send.mockResolvedValue({ data: { code: 0, data: null } } as any);
  const first = debugApi.events('scene', 17);
  await jest.runAllTimersAsync();
  await first;
  expect(send.mock.calls[0][0].data).toEqual({ cursor: 17, waitSeconds: 0 });
  const next = debugApi.events('scene', 17, undefined, { stateVersion: 27, busy: true });
  await jest.runAllTimersAsync();
  await next;
  expect(send.mock.calls[1][0].data).toEqual({
    cursor: 17,
    waitSeconds: 20,
    knownStateVersion: 27,
    knownBusy: true,
  });
});
