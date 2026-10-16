import { act, renderHook, waitFor } from '@testing-library/react';
import cApi from '../../Utils/API/c-api';
import { ApiRequestError } from '../../Utils/API/request';
import { useRunTask } from './useRunTask';
import { RunDetail } from './runTypes';
jest.mock('../../Utils/API/c-api', () => ({
  __esModule: true,
  default: {
    runCases: jest.fn(),
    getRunQuery: jest.fn(),
    cancelRun: jest.fn(),
    getLatestRun: jest.fn(),
  },
}));
const request = { problemCode: 'P', judgeTemplateId: '1', code: 'code', cases: [{ input: '' }] };
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});
it('does not recover, poll, create or cancel tasks when Run is disabled', async () => {
  jest.useFakeTimers();
  try {
    localStorage.setItem('answerIde:active:alice:P', 'abc');
    const view = renderHook(() => useRunTask('alice:P', { type: 0, problemCode: 'P' }, false));
    await act(async () => {
      await view.result.current.start(request);
      await view.result.current.cancel();
      view.result.current.refresh();
      jest.advanceTimersByTime(60000);
    });
    expect(view.result.current.blocked).toBe(true);
    expect(view.result.current.recovering).toBe(false);
    expect(view.result.current.busy).toBe(false);
    expect(cApi.getLatestRun).not.toHaveBeenCalled();
    expect(cApi.getRunQuery).not.toHaveBeenCalled();
    expect(cApi.runCases).not.toHaveBeenCalled();
    expect(cApi.cancelRun).not.toHaveBeenCalled();
    expect(localStorage.getItem('answerIde:active:alice:P')).toBe('abc');
    view.unmount();
  } finally {
    jest.useRealTimers();
  }
});

it('invalidates an outstanding recovery and stops polling when Run is disabled', async () => {
  let recover!: (value: any) => void;
  jest.mocked(cApi.getLatestRun).mockImplementation(
    () =>
      new Promise((resolve) => {
        recover = resolve;
      }),
  );
  const context = { type: 0 as const, problemCode: 'P' };
  const view = renderHook(({ enabled }) => useRunTask('alice:P', context, enabled), {
    initialProps: { enabled: true },
  });
  view.rerender({ enabled: false });
  await act(async () => {
    recover({ detail: { submissionId: 'abc', judgeResult: 8 }, hasActiveRun: true });
  });
  expect(view.result.current.id).toBeUndefined();
  expect(view.result.current.detail).toBeUndefined();
  expect(view.result.current.blocked).toBe(true);
  expect(cApi.getRunQuery).not.toHaveBeenCalled();
  view.unmount();
});
it.each([400, 403, 404, 410])(
  'releases a restored task after a terminal query error %s',
  async (status) => {
    localStorage.setItem('answerIde:active:alice:P', 'abc');
    jest
      .mocked(cApi.getRunQuery)
      .mockRejectedValue(new ApiRequestError('Task unavailable', status));
    const view = renderHook(() => useRunTask('alice:P'));
    await waitFor(() => expect(view.result.current.busy).toBe(false));
    expect(view.result.current.id).toBeUndefined();
    expect(localStorage.getItem('answerIde:active:alice:P')).toBeNull();
    jest.mocked(cApi.runCases).mockResolvedValue('def');
    jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'def', judgeResult: -1 });
    await act(async () => {
      await view.result.current.start(request);
    });
    await waitFor(() => expect(view.result.current.detail?.submissionId).toBe('def'));
    view.unmount();
  },
);

it('keeps a restored task and retries after temporary server failure', async () => {
  jest.useFakeTimers();
  try {
    localStorage.setItem('answerIde:active:alice:P', 'abc');
    jest
      .mocked(cApi.getRunQuery)
      .mockRejectedValueOnce(new ApiRequestError('Unavailable', 503))
      .mockResolvedValue({ submissionId: 'abc', judgeResult: -1 });
    const view = renderHook(() => useRunTask('alice:P'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(view.result.current.busy).toBe(true);
    expect(localStorage.getItem('answerIde:active:alice:P')).toBe('abc');
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });
    expect(view.result.current.detail?.judgeResult).toBe(-1);
    expect(view.result.current.busy).toBe(false);
    view.unmount();
  } finally {
    jest.useRealTimers();
  }
});
it('treats END (-1) as completed and stops polling', async () => {
  jest.mocked(cApi.runCases).mockResolvedValue('abc');
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'abc', judgeResult: -1 });
  const { result } = renderHook(() => useRunTask('alice:P'));
  await act(async () => {
    await result.current.start(request);
  });
  await waitFor(() => expect(result.current.detail?.judgeResult).toBe(-1));
  expect(result.current.busy).toBe(false);
  expect(localStorage.getItem('answerIde:active:alice:P')).toBe('abc');
});
it('ignores an old task response after changing user or problem', async () => {
  let resolve!: (data: RunDetail) => void;
  jest.mocked(cApi.runCases).mockResolvedValue('abc');
  jest.mocked(cApi.getRunQuery).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = renderHook(({ scope }) => useRunTask(scope), { initialProps: { scope: 'alice:P' } });
  await act(async () => {
    await view.result.current.start(request);
  });
  view.rerender({ scope: 'bob:Q' });
  await act(async () => {
    resolve({ submissionId: 'abc', judgeResult: 1 });
  });
  expect(view.result.current.detail).toBeUndefined();
  expect(view.result.current.id).toBeUndefined();
});
it('cancel fences a delayed running response while fetching the cancelled result', async () => {
  let old!: (data: RunDetail) => void;
  jest.mocked(cApi.runCases).mockResolvedValue('abc');
  jest
    .mocked(cApi.getRunQuery)
    .mockImplementationOnce(
      () =>
        new Promise((done) => {
          old = done;
        }),
    )
    .mockResolvedValue({ submissionId: 'abc', judgeResult: 99 });
  jest.mocked(cApi.cancelRun).mockResolvedValue(null);
  const { result } = renderHook(() => useRunTask('alice:P'));
  await act(async () => {
    await result.current.start(request);
  });
  await act(async () => {
    await result.current.cancel();
  });
  await act(async () => {
    old({ submissionId: 'abc', judgeResult: -2 });
  });
  expect(result.current.detail?.judgeResult).toBe(99);
  expect(result.current.busy).toBe(false);
});
it('restores a pending run after remount', async () => {
  localStorage.setItem('answerIde:active:alice:P', 'abc');
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'abc', judgeResult: 8 });
  const { result } = renderHook(() => useRunTask('alice:P'));
  await waitFor(() => expect(result.current.detail?.judgeResult).toBe(8));
  expect(cApi.getRunQuery).toHaveBeenCalledWith({ submissionId: 'abc' });
});
it('reuses the HTTP request key after an ambiguous failure, without reusing it for changed input', async () => {
  jest.mocked(cApi.runCases).mockRejectedValue(new Error('response lost'));
  const { result } = renderHook(() => useRunTask('alice:P'));
  await act(async () => {
    await result.current.start(request);
  });
  await act(async () => {
    await result.current.start(request);
  });
  const calls = jest.mocked(cApi.runCases).mock.calls;
  expect(calls[0][0].clientRequestId).toBeTruthy();
  expect(calls[1][0].clientRequestId).toBe(calls[0][0].clientRequestId);
  await act(async () => {
    await result.current.start({ ...request, code: 'changed' });
  });
  expect(calls[2][0].clientRequestId).not.toBe(calls[0][0].clientRequestId);
});
it('coalesces progress hints while a REST request is in flight and never trusts WS as final truth', async () => {
  let resolve!: (data: RunDetail) => void;
  jest.mocked(cApi.runCases).mockResolvedValue('abc');
  jest.mocked(cApi.getRunQuery).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const { result } = renderHook(() => useRunTask('alice:P'));
  await act(async () => {
    await result.current.start(request);
  });
  act(() => {
    result.current.refresh();
    result.current.refresh();
  });
  expect(cApi.getRunQuery).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolve({ submissionId: 'abc', judgeResult: -2 });
  });
  act(() => {
    result.current.refresh();
  });
  expect(cApi.getRunQuery).toHaveBeenCalledTimes(2);
  expect(result.current.busy).toBe(true);
  await act(async () => {
    resolve({ submissionId: 'abc', judgeResult: -1 });
  });
  act(() => {
    result.current.refresh();
  });
  expect(cApi.getRunQuery).toHaveBeenCalledTimes(2);
  expect(result.current.busy).toBe(false);
});

it('recovers the latest completed result from the server even without browser storage', async () => {
  const context = { type: 1 as const, bizId: '77', problemCode: '1' };
  jest
    .mocked(cApi.getLatestRun)
    .mockResolvedValue({ detail: { submissionId: 'abc', judgeResult: 1 }, hasActiveRun: false });
  const { result } = renderHook(() => useRunTask('alice:Contest-77-1', context));
  await waitFor(() => expect(result.current.recovering).toBe(false));
  expect(result.current.detail?.submissionId).toBe('abc');
  expect(result.current.busy).toBe(false);
  expect(cApi.getLatestRun).toHaveBeenCalledWith(context);
});
it('blocks another business problem while any run is active and enforces the server cooldown', async () => {
  const context = { type: 2 as const, bizId: '99', groupIndex: 0, problemIndex: 0 };
  jest
    .mocked(cApi.getLatestRun)
    .mockResolvedValue({ detail: null, hasActiveRun: true, cooldownUntil: Date.now() + 30000 });
  const { result } = renderHook(() => useRunTask('alice:problemSet-99-0-0', context));
  await waitFor(() => expect(result.current.recovering).toBe(false));
  expect(result.current.blocked).toBe(true);
  await act(async () => {
    await result.current.start({ ...request, context });
  });
  expect(cApi.runCases).not.toHaveBeenCalled();
});
it('restores a queued run from the server and polls through completion', async () => {
  const context = { type: 0 as const, problemCode: 'P' };
  jest
    .mocked(cApi.getLatestRun)
    .mockResolvedValue({ detail: { submissionId: 'abc', judgeResult: 0 }, hasActiveRun: true });
  jest.mocked(cApi.getRunQuery).mockResolvedValue({ submissionId: 'abc', judgeResult: 1 });
  const { result } = renderHook(() => useRunTask('alice:P', context));
  await waitFor(() => expect(result.current.detail?.judgeResult).toBe(1));
  expect(result.current.busy).toBe(false);
  expect(localStorage.getItem('answerIde:active:alice:P')).toBe('abc');
});
