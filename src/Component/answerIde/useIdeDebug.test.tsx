import { act, renderHook, waitFor } from '@testing-library/react';
import useIdeDebug from './useIdeDebug';
import debugApi, { DebugSnapshot } from '../../Utils/API/ide-debug';
jest.mock('../../Utils/API/ide-debug', () => ({
  __esModule: true,
  default: {
    capabilities: jest.fn(),
    create: jest.fn(),
    current: jest.fn(),
    command: jest.fn(),
    events: jest.fn(),
    control: jest.fn(),
    cancel: jest.fn(),
  },
}));
const api = jest.mocked(debugApi);
const props = {
  enabled: true,
  language: 'cpp' as const,
  judgeTemplateId: '6',
  problemCode: 'P1',
  context: { type: 0 as const },
  code: 'int main(){}',
};
const scene: DebugSnapshot = {
  sessionId: 'session-1234567890123456',
  sessionEpoch: 'epoch-1234567890123456',
  state: 'stopped',
  stateVersion: 2,
  stopId: 'stop-1234567890123456',
  threadId: 1,
  busy: false,
  language: 'cpp',
  templateId: '6',
  sourceName: 'main.cc',
  sourceLineOffset: 0,
  startedAt: 1,
  hardExpiresAt: 1_800_001,
  idleExpiresAt: 300_001,
  ticket: null,
  commands: [],
  cursor: 1,
  reason: '',
};
beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
  api.capabilities.mockResolvedValue({
    data: { enabled: true, protocolVersion: 2, languages: ['cpp'], templateIds: ['6'] },
  });
  api.events.mockImplementation(() => new Promise(() => undefined));
  api.current.mockResolvedValue({ data: null });
});

test('optional unavailable debugger stays hidden and does not create a session', async () => {
  api.capabilities.mockResolvedValue({ data: null });
  const { result } = renderHook(() => useIdeDebug(props));
  await waitFor(() => expect(api.capabilities).toHaveBeenCalledTimes(1));
  expect(result.current.available).toBe(false);
  expect(api.create).not.toHaveBeenCalled();
});

test('poll acknowledges delivered event cursor even when snapshot leads the log', async () => {
  api.create.mockResolvedValue({ data: scene });
  api.events.mockResolvedValueOnce({
    data: { snapshot: { ...scene, cursor: 9 }, events: [], truncated: false, cursor: 5 },
  });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  await waitFor(() => expect(api.events).toHaveBeenCalledTimes(2));
  expect(api.events.mock.calls[1][1]).toBe(5);
});

test('lost create acknowledgement retries the same idempotent create request', async () => {
  api.create.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: scene });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('42\n');
  });
  expect(api.create).toHaveBeenCalledTimes(2);
  expect(api.create.mock.calls[0][0]).toEqual(api.create.mock.calls[1][0]);
  expect(api.current).not.toHaveBeenCalled();
  expect(result.current.session?.sessionId).toBe(scene.sessionId);
  expect(result.current.sourceChanged).toBe(false);
  expect(api.events).toHaveBeenCalledTimes(1);
});

test('lost step reply never automatically repeats an execution command', async () => {
  api.create.mockResolvedValue({ data: scene });
  api.command.mockResolvedValue({ data: null });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  await act(async () => {
    await result.current.execute('next', { threadId: 1 });
  });
  expect(api.command).toHaveBeenCalledTimes(1);
  expect(api.command.mock.calls[0][0]).toMatchObject({ stateVersion: 2, stopId: scene.stopId });
  expect(result.current.notice).toContain('同步状态');
  expect(api.create).toHaveBeenCalledTimes(1);
});

test('stop remains available while an ordinary command waits for resources', async () => {
  const queued = {
    ...scene,
    busy: true,
    ticket: { ticketId: 'ticket-1234567890123456', queueReason: 'memory', queueExpiresAt: 1 },
  };
  api.create.mockResolvedValue({ data: queued });
  api.control.mockResolvedValue({ data: { ...queued, state: 'terminated' } });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  expect(result.current.canInspect).toBe(false);
  await act(async () => {
    await result.current.control('stop');
  });
  expect(api.control).toHaveBeenCalledWith(queued, 'stop');
  expect(result.current.active).toBe(false);
});

test('an incompatible optional capability response stays hidden without throwing', async () => {
  api.capabilities.mockResolvedValue({ data: { enabled: true, languages: ['cpp'] } as any });
  const { result } = renderHook(() => useIdeDebug(props));
  await waitFor(() => expect(api.capabilities).toHaveBeenCalledTimes(1));
  expect(result.current.available).toBe(false);
  expect(api.create).not.toHaveBeenCalled();
});

test('ignores a late older poll snapshot after a command acknowledgement', async () => {
  let poll!: (value: any) => void;
  api.events.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        poll = resolve;
      }),
  );
  api.create.mockResolvedValue({ data: scene });
  api.command.mockResolvedValue({ data: { ...scene, stateVersion: 3, cursor: 3, busy: true } });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  await act(async () => {
    await result.current.execute('next', { threadId: 1 });
  });
  await act(async () => {
    poll({ data: { snapshot: scene, events: [], truncated: false } });
  });
  expect(result.current.session?.stateVersion).toBe(3);
  expect(result.current.canInspect).toBe(false);
});

test('retains program terminal output across explicit restarts', async () => {
  let poll!: (value: any) => void;
  api.events.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        poll = resolve;
      }),
  );
  api.create
    .mockResolvedValueOnce({ data: scene })
    .mockResolvedValueOnce({ data: { ...scene, sessionId: 'scene-2' } });
  api.control.mockResolvedValue({
    data: { ...scene, state: 'terminated', stateVersion: 4, cursor: 4 },
  });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  await act(async () => {
    poll({
      data: {
        snapshot: { ...scene, cursor: 2 },
        events: [{ type: 'output', data: { output: '42\n' } }],
        truncated: false,
      },
    });
  });
  await act(async () => {
    await result.current.control('stop');
    await result.current.start('');
  });
  expect(result.current.output).toContain('42\n');
  expect(api.create).toHaveBeenCalledTimes(2);
});

test('reload restores the owned frozen source and output cursor without replaying execution', async () => {
  const restoreSource = jest.fn();
  localStorage.setItem(
    'debug:alice:P1',
    JSON.stringify({
      schema: 1,
      session: scene,
      code: props.code,
      cursor: 1,
      output: '42\n',
      history: '(debug) next\n',
      watches: ['value'],
      problemCode: props.problemCode,
      context: props.context,
      templateId: '6',
      language: 'cpp',
    }),
  );
  api.create.mockResolvedValue({ data: { ...scene, breakpoints: [2] } });
  const { result } = renderHook(() =>
    useIdeDebug({ ...props, storageKey: 'debug:alice:P1', restoreEnabled: true, restoreSource }),
  );
  await waitFor(() => expect(result.current.active).toBe(true));
  expect(api.create).toHaveBeenCalledWith(
    expect.objectContaining({
      restoreOnly: true,
      resumeSessionId: scene.sessionId,
      resumeSessionEpoch: scene.sessionEpoch,
    }),
  );
  expect(restoreSource).toHaveBeenCalledWith(props.code, '6');
  expect(result.current.output).toBe('42\n');
  expect(result.current.watchExpressions).toEqual(['value']);
  expect(api.events).toHaveBeenCalledWith(scene.sessionId, 1, expect.anything(), {
    stateVersion: scene.stateVersion,
    busy: scene.busy,
  });
  expect(api.command).not.toHaveBeenCalled();
});

test('busy-only snapshot releases inspection without advancing or replaying the event cursor', async () => {
  const busy = { ...scene, stateVersion: 27, cursor: 4, busy: true };
  api.create.mockResolvedValue({ data: busy });
  api.events
    .mockResolvedValueOnce({
      data: { snapshot: busy, events: [], truncated: false, cursor: 4 },
    })
    .mockResolvedValueOnce({
      data: { snapshot: { ...busy, busy: false }, events: [], truncated: false, cursor: 4 },
    });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  await waitFor(() => expect(result.current.canInspect).toBe(true));
  expect(api.events.mock.calls[1]).toEqual([
    scene.sessionId,
    4,
    expect.anything(),
    { stateVersion: 27, busy: true },
  ]);
  expect(api.events.mock.calls[2]).toEqual([
    scene.sessionId,
    4,
    expect.anything(),
    { stateVersion: 27, busy: false },
  ]);
  expect(api.command).not.toHaveBeenCalled();
});

test('fresh start explicitly replaces old account scene and missing browser cache never restores an arbitrary current scene', async () => {
  api.create.mockResolvedValue({ data: scene });
  const { result } = renderHook(() =>
    useIdeDebug({ ...props, storageKey: 'debug:alice:P1', restoreEnabled: true }),
  );
  await waitFor(() => expect(result.current.available).toBe(true));
  expect(api.create).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.start('');
  });
  expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ replaceExisting: true }));
  expect(api.current).not.toHaveBeenCalled();
});

test('unconfirmed kernel cleanup is not reported as a successful stop', async () => {
  api.create.mockResolvedValue({ data: scene });
  api.control.mockResolvedValue({
    data: {
      ...scene,
      state: 'lost',
      stateVersion: 4,
      cursor: 4,
      reason: 'DEBUG_CLEANUP_UNCONFIRMED',
    },
  });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  let stopped: boolean | undefined;
  await act(async () => {
    stopped = await result.current.control('stop');
  });
  expect(stopped).toBe(false);
  expect(result.current.notice).toContain('无法确认回收');
});

test('older debugger protocol remains optional and is not sent new create fields', async () => {
  api.capabilities.mockResolvedValue({
    data: { enabled: true, protocolVersion: 1, languages: ['cpp'], templateIds: ['6'] },
  });
  const { result } = renderHook(() => useIdeDebug(props));
  await waitFor(() => expect(api.capabilities).toHaveBeenCalledTimes(1));
  expect(result.current.available).toBe(false);
  expect(api.create).not.toHaveBeenCalled();
});

test('large command history does not exhaust browser quota or prevent recovery cache', async () => {
  const huge = {
    ...scene,
    commands: [
      {
        commandId: 'variables-1234567890',
        operation: 'variables',
        status: 'completed' as const,
        result: { payload: 'x'.repeat(6 * 1024 * 1024) },
      },
    ],
  };
  api.create.mockResolvedValue({ data: huge });
  const { result } = renderHook(() => useIdeDebug({ ...props, storageKey: 'debug:alice:P1' }));
  await act(async () => {
    await result.current.start('');
  });
  await waitFor(() => expect(localStorage.getItem('debug:alice:P1')).not.toBeNull());
  const stored = localStorage.getItem('debug:alice:P1')!;
  expect(stored.length).toBeLessThan(1024 * 1024);
  expect(JSON.parse(stored).session.sessionId).toBe(scene.sessionId);
});

test.each([
  ['DEBUG_COMPILE_FAILED', '编译失败'],
  ['DEBUG_COMPILE_TIMEOUT', '编译超时'],
])(
  'announces %s immediately, preserving public output and the terminal reason',
  async (reason, text) => {
    let finish!: (value: any) => void;
    api.create.mockResolvedValue({ data: { ...scene, state: 'compiling' } });
    api.events
      .mockResolvedValueOnce({
        data: {
          snapshot: { ...scene, state: 'compiling', cursor: 2 },
          events: [
            {
              cursor: 2,
              type: 'compileError',
              data: {
                code: reason,
                output: 'main.cc: missing semicolon\n',
                stderr: 'guardian private diagnostic',
                truncated: true,
              },
            },
          ],
          truncated: false,
        },
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const { result } = renderHook(() => useIdeDebug(props));
    await act(async () => {
      await result.current.start('');
    });
    await waitFor(() => expect(result.current.noticeType).toBe('error'));
    expect(result.current.session?.state).toBe('compiling');
    expect(result.current.notice).toContain(text);
    expect(result.current.notice).toContain('已截断');
    expect(result.current.output).toContain('main.cc: missing semicolon');
    expect(result.current.output).not.toContain('guardian private diagnostic');
    await act(async () => {
      finish({
        data: {
          snapshot: {
            ...scene,
            state: 'failed',
            stateVersion: 3,
            cursor: 3,
            reason,
          },
          events: [],
          truncated: false,
        },
      });
    });
    expect(result.current.active).toBe(false);
    expect(result.current.noticeType).toBe('error');
    expect(result.current.notice).toContain(text);
    expect(result.current.notice).toContain('已截断');
  },
);

test.each([
  ['DEBUG_COMPILE_FAILED', '编译失败'],
  ['DEBUG_COMPILE_TIMEOUT', '编译超时'],
  ['DEBUG_COMPILE_MEMORY_LIMIT', '编译内存超限'],
  ['DEBUG_COMPILE_OUTPUT_LIMIT', '编译输出超限'],
  ['DEBUG_COMPILE_SANDBOX_FAILED', '编译沙箱暂不可用'],
  ['DEBUG_COMPILEERROR', '编译失败'],
])('shows explicit error notice for a terminal %s snapshot', async (reason, text) => {
  api.create.mockResolvedValue({ data: { ...scene, state: 'failed', reason } });
  const { result } = renderHook(() => useIdeDebug(props));
  await act(async () => {
    await result.current.start('');
  });
  expect(result.current.noticeType).toBe('error');
  expect(result.current.notice).toContain(text);
  expect(result.current.notice).not.toBe('调试已结束，请重新启动。');
  expect(result.current.active).toBe(false);
});

test.each([
  ['DEBUG_COMPILE_FAILED', '编译失败'],
  ['DEBUG_COMPILE_TIMEOUT', '编译超时'],
])(
  'restores explicit %s from the server snapshot without executing again',
  async (reason, text) => {
    localStorage.setItem(
      'debug:compile:restore',
      JSON.stringify({
        schema: 1,
        session: scene,
        code: props.code,
        cursor: 1,
        output: 'compiler partial output\n',
        problemCode: props.problemCode,
        context: props.context,
        templateId: '6',
        language: 'cpp',
      }),
    );
    api.create.mockResolvedValue({ data: { ...scene, state: 'failed', stateVersion: 3, reason } });
    const { result } = renderHook(() =>
      useIdeDebug({
        ...props,
        storageKey: 'debug:compile:restore',
        restoreEnabled: true,
      }),
    );
    await waitFor(() => expect(result.current.noticeType).toBe('error'));
    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ restoreOnly: true }));
    expect(result.current.notice).toContain(text);
    expect(result.current.output).toContain('compiler partial output');
    expect(result.current.active).toBe(false);
    expect(api.command).not.toHaveBeenCalled();
  },
);
