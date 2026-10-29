import { act, renderHook, waitFor } from '@testing-library/react';
import useIdeIntelligence from './useIdeIntelligence';
import ideApi from '../../Utils/API/ide-intelligence';
jest.mock('../../Utils/API/ide-intelligence', () => ({
  __esModule: true,
  default: {
    capabilities: jest.fn(),
    createSession: jest.fn(),
    sync: jest.fn(),
    completion: jest.fn(),
    signatureHelp: jest.fn(),
    definition: jest.fn(),
    diagnostics: jest.fn(),
    close: jest.fn(),
    state: jest.fn(),
  },
}));
const api = jest.mocked(ideApi);
const base = {
  enabled: true,
  language: 'python' as const,
  problemCode: 'P',
  context: { type: 0 as const },
  code: 'x=1',
};
beforeEach(() => {
  jest.resetAllMocks();
  api.capabilities.mockResolvedValue({
    enabled: true,
    protocolVersion: 1,
    languages: ['python'],
  } as any);
  api.createSession.mockResolvedValue({ sessionId: 'sid', revision: 1, reused: false } as any);
  api.diagnostics.mockResolvedValue({ status: 'ready', revision: 1, diagnostics: [] });
  api.close.mockResolvedValue({ closed: true });
  api.state.mockResolvedValue({ sessionId: 'sid', revision: 1, expiresAt: 0 });
});

test('coalesces pending positions and discards an older response even for unchanged text', async () => {
  const { result } = renderHook(() => useIdeIntelligence(base));
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  let release!: (value: any) => void;
  api.completion
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValue({ status: 'ready', revision: 1, items: [{ label: 'latest' }] });
  let first: any, middle: any, last: any;
  act(() => {
    first = result.current.completion(1, 2);
  });
  await waitFor(() => expect(api.completion).toHaveBeenCalledTimes(1));
  act(() => {
    middle = result.current.completion(1, 3);
    last = result.current.completion(1, 4);
  });
  await act(async () => {
    release({ status: 'ready', revision: 1, items: [{ label: 'old' }] });
    expect((await first).items).toEqual([]);
    expect((await middle).items).toEqual([]);
    expect((await last).items).toEqual([{ label: 'latest' }]);
  });
  expect(api.completion).toHaveBeenCalledTimes(2);
  expect(api.completion.mock.calls[1][1].column).toBe(4);
});

test('synchronizes signature help and propagates incomplete results', async () => {
  const { result } = renderHook(() => useIdeIntelligence(base));
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  api.signatureHelp.mockResolvedValue({
    status: 'ready',
    revision: 1,
    signatures: [{ label: 'print(value)' }],
  });
  api.completion.mockResolvedValue({
    status: 'ready',
    revision: 1,
    isIncomplete: true,
    items: [{ label: 'print' }],
  });
  await act(async () => {
    expect((await result.current.signatureHelp(1, 4)).signatures).toHaveLength(1);
    expect(
      (await result.current.completion(1, 4, 'triggerForIncompleteCompletions')).isIncomplete,
    ).toBe(true);
  });
  expect(api.signatureHelp).toHaveBeenCalledWith(
    'sid',
    { revision: 1, line: 1, column: 4 },
    expect.any(Function),
  );
});

test('skips obsolete sync retries after a conflict while preserving the recovered revision', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  let release!: (value: any) => void;
  api.sync.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  rerender({ ...base, code: 'old=2' });
  let old: any;
  act(() => {
    old = result.current.completion(1, 6);
  });
  await waitFor(() => expect(api.sync).toHaveBeenCalledTimes(1));
  rerender({ ...base, code: 'new=3' });
  api.sync.mockResolvedValueOnce({ sessionId: 'sid', revision: 5, expiresAt: 0 });
  api.completion.mockResolvedValueOnce({ status: 'ready', revision: 5, items: [{ label: 'new' }] });
  let latest: any;
  act(() => {
    latest = result.current.completion(1, 6);
  });
  await act(async () => {
    release({ conflict: true, revision: 4 });
    expect((await old).items).toEqual([]);
    expect((await latest).items).toEqual([{ label: 'new' }]);
  });
  expect(api.sync).toHaveBeenCalledTimes(2);
  expect(api.sync).toHaveBeenLastCalledWith('sid', { baseRevision: 4, revision: 5, code: 'new=3' });
});

test('does not sync obsolete text after waiting for uncertain-revision recovery', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  rerender({ ...base, code: 'x=2' });
  api.sync.mockResolvedValueOnce(null);
  await act(async () => {
    await result.current.completion(1, 4);
  });
  let release!: (value: any) => void;
  api.state.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  let old: any;
  act(() => {
    old = result.current.completion(1, 4);
  });
  await waitFor(() => expect(api.state).toHaveBeenCalledTimes(1));
  rerender({ ...base, code: 'x=3' });
  api.sync.mockResolvedValueOnce({ sessionId: 'sid', revision: 3, expiresAt: 0 });
  api.completion.mockResolvedValueOnce({ status: 'ready', revision: 3, items: [] });
  let latest: any;
  act(() => {
    latest = result.current.completion(1, 4);
  });
  await act(async () => {
    release({ sessionId: 'sid', revision: 2, expiresAt: 0 });
    await Promise.all([old, latest]);
  });
  expect(api.sync).toHaveBeenCalledTimes(2);
  expect(api.sync).toHaveBeenLastCalledWith('sid', { baseRevision: 2, revision: 3, code: 'x=3' });
});

test('syncs the current text before completion and silently ignores null results', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  rerender({ ...base, code: 'x=2' });
  api.sync.mockResolvedValue({ sessionId: 'sid', revision: 2, expiresAt: 0 });
  api.completion.mockResolvedValue({ status: 'ready', revision: 2, items: [{ label: 'new' }] });
  let answer: any;
  await act(async () => {
    answer = await result.current.completion(1, 4);
  });
  expect(api.sync).toHaveBeenCalledWith('sid', { baseRevision: 1, revision: 2, code: 'x=2' });
  expect(api.sync.mock.invocationCallOrder[0]).toBeLessThan(
    api.completion.mock.invocationCallOrder[0],
  );
  expect(answer.items[0].label).toBe('new');
  api.definition.mockResolvedValue(null);
  await act(async () => {
    answer = await result.current.definition(1, 1);
  });
  expect(answer.locations).toEqual([]);
});

test('does not display an old response after the document changes', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  let release!: (value: any) => void;
  api.completion.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  let pending!: ReturnType<typeof result.current.completion>;
  act(() => {
    pending = result.current.completion(1, 4);
  });
  await waitFor(() => expect(api.completion).toHaveBeenCalledTimes(1));
  rerender({ ...base, code: 'different' });
  let answer: any;
  await act(async () => {
    release({ status: 'ready', revision: 1, items: [{ label: 'old' }] });
    answer = await pending;
  });
  expect(answer.items).toEqual([]);
});

test('reconciles the same session after a committed sync loses its response', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  rerender({ ...base, code: 'x=2' });
  api.sync.mockResolvedValueOnce(null);
  await act(async () => {
    await result.current.completion(1, 4);
  });
  expect(api.completion).not.toHaveBeenCalled();
  api.state.mockResolvedValueOnce({ sessionId: 'sid', revision: 2, expiresAt: 0 });
  api.sync.mockResolvedValueOnce({ sessionId: 'sid', revision: 3, expiresAt: 0 });
  api.completion.mockResolvedValueOnce({
    status: 'ready',
    revision: 3,
    items: [{ label: 'recovered' }],
  });
  let answer: any;
  await act(async () => {
    answer = await result.current.completion(1, 4);
  });
  expect(api.state).toHaveBeenCalledWith('sid');
  expect(api.createSession).toHaveBeenCalledTimes(1);
  expect(api.sync).toHaveBeenLastCalledWith('sid', { baseRevision: 2, revision: 3, code: 'x=2' });
  expect(answer.items[0].label).toBe('recovered');
});

test('uses the server revision once on conflict and recreates an expired session', async () => {
  const { result, rerender } = renderHook((props) => useIdeIntelligence(props), {
    initialProps: base,
  });
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  rerender({ ...base, code: 'x=3' });
  api.sync
    .mockResolvedValueOnce({ conflict: true, revision: 4 } as any)
    .mockResolvedValueOnce({ sessionId: 'sid', revision: 5, expiresAt: 0 });
  api.completion.mockResolvedValueOnce({ status: 'ready', revision: 5, items: [] });
  await act(async () => {
    await result.current.completion(1, 4);
  });
  expect(api.sync).toHaveBeenLastCalledWith('sid', { baseRevision: 4, revision: 5, code: 'x=3' });
  rerender({ ...base, code: 'x=4' });
  api.sync.mockResolvedValueOnce({ expired: true } as any);
  await act(async () => {
    await result.current.completion(1, 4);
  });
  expect(result.current.sessionId).toBeUndefined();
  api.createSession.mockResolvedValueOnce({ sessionId: 'new', revision: 1, reused: false } as any);
  api.completion.mockResolvedValueOnce({ status: 'ready', revision: 1, items: [] });
  await act(async () => {
    await result.current.completion(1, 4);
  });
  expect(result.current.sessionId).toBe('new');
});

test('a lost read-only completion does not force a revision sync', async () => {
  const { result } = renderHook(() => useIdeIntelligence(base));
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  api.completion.mockResolvedValueOnce(null);
  await act(async () => {
    await result.current.completion(1, 4);
  });
  api.completion.mockResolvedValueOnce({ status: 'ready', revision: 1, items: [] });
  await act(async () => {
    await result.current.completion(1, 4);
  });
  expect(api.state).not.toHaveBeenCalled();
  expect(api.sync).not.toHaveBeenCalled();
});

test('recovers a temporarily unavailable session create on the next user request', async () => {
  api.createSession.mockResolvedValueOnce(null);
  const { result } = renderHook(() => useIdeIntelligence(base));
  await waitFor(() => expect(api.createSession).toHaveBeenCalledTimes(1));
  expect(result.current.sessionId).toBeUndefined();
  api.completion.mockResolvedValueOnce({
    status: 'ready',
    revision: 1,
    items: [{ label: 'recovered' }],
  });
  await act(async () => {
    expect((await result.current.completion(1, 4)).items).toEqual([{ label: 'recovered' }]);
  });
  expect(result.current.sessionId).toBe('sid');
  expect(api.createSession.mock.calls[1][0].clientSessionKey).toBe(
    api.createSession.mock.calls[0][0].clientSessionKey,
  );
});

test('a read-only request after idle expiration allows the same text to create a new session', async () => {
  const { result } = renderHook(() => useIdeIntelligence(base));
  await waitFor(() => expect(result.current.sessionId).toBe('sid'));
  api.definition.mockResolvedValueOnce({ expired: true } as any);
  await act(async () => {
    await result.current.definition(1, 1);
  });
  expect(result.current.sessionId).toBeUndefined();
  api.createSession.mockResolvedValueOnce({
    sessionId: 'renewed',
    revision: 1,
    reused: false,
  } as any);
  api.definition.mockResolvedValueOnce({ status: 'ready', revision: 1, locations: [] });
  await act(async () => {
    await result.current.definition(1, 1);
  });
  expect(result.current.sessionId).toBe('renewed');
  expect(api.sync).not.toHaveBeenCalled();
});
