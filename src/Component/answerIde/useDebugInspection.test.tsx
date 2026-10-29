import { act, renderHook, waitFor } from '@testing-library/react';
import useDebugInspection from './useDebugInspection';
import type { IdeDebugController } from './useIdeDebug';
test('loads stack, scope and variables in order, invalidates handles at the next stop', async () => {
  let counter = 0;
  const execute = jest.fn(async () => `cmd-${++counter}`);
  let debug = {
    sourceChanged: false,
    threadId: 9,
    canInspect: true,
    execute,
    session: { sessionId: 'scene', stopId: 'stop-1', state: 'stopped', commands: [] as any[] },
  } as unknown as IdeDebugController;
  const { result, rerender } = renderHook(() => useDebugInspection(debug));
  await waitFor(() => expect(execute).toHaveBeenCalledWith('stackTrace', { threadId: 9 }));
  const reply = async (id: string, operation: string, value: Record<string, unknown>) => {
    debug = {
      ...debug,
      session: {
        ...debug.session!,
        commands: [
          ...debug.session!.commands,
          { commandId: id, operation, status: 'completed', result: value },
        ],
      },
    };
    await act(async () => rerender());
  };
  await reply('cmd-1', 'stackTrace', {
    stackFrames: [{ id: 12, name: 'main', line: 4, editableSource: true }],
  });
  await waitFor(() => expect(execute).toHaveBeenCalledWith('scopes', { frameId: 12 }));
  await reply('cmd-2', 'scopes', { scopes: [{ variablesReference: 71 }] });
  await waitFor(() =>
    expect(execute).toHaveBeenCalledWith('variables', {
      variablesReference: 71,
      start: 0,
      count: 100,
    }),
  );
  await reply('cmd-3', 'variables', {
    variables: [{ name: 'value', value: '42', variablesReference: 0 }],
  });
  expect(result.current.line).toBe(4);
  expect(result.current.variables[0].value).toBe('42');
  debug = {
    ...debug,
    canInspect: false,
    session: { ...debug.session!, state: 'running', stopId: 'stop-2' },
  };
  await act(async () => rerender());
  expect(result.current.variables).toEqual([]);
  expect(result.current.frame).toBeUndefined();
  expect(execute).toHaveBeenCalledTimes(3);
});

test('safe watch refreshes data paths per stop and hover never evaluates an expression', async () => {
  let counter = 0;
  const execute = jest.fn(async () => `watch-${++counter}`);
  let debug = {
    sourceChanged: false,
    threadId: 1,
    canInspect: true,
    execute,
    watchExpressions: ['user.name'],
    setWatchExpressions: jest.fn(),
    session: { sessionId: 'scene', stopId: 'one', state: 'stopped', commands: [] as any[] },
  } as unknown as IdeDebugController;
  const { result, rerender } = renderHook(() => useDebugInspection(debug));
  const reply = async (operation: string, result: Record<string, unknown>) => {
    const id = `watch-${counter}`;
    debug = {
      ...debug,
      session: {
        ...debug.session!,
        commands: [
          ...debug.session!.commands,
          { commandId: id, operation, status: 'completed', result },
        ],
      },
    };
    await act(async () => rerender());
  };
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
  await reply('stackTrace', {
    stackFrames: [{ id: 7, name: 'main', line: 2, editableSource: true }],
  });
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(2));
  await reply('scopes', { scopes: [{ variablesReference: 10 }] });
  await waitFor(() => expect(execute).toHaveBeenCalledTimes(3));
  await reply('variables', {
    variables: [{ name: 'user', value: '<object>', variablesReference: 11 }],
  });
  await waitFor(() =>
    expect(execute).toHaveBeenLastCalledWith('watch', { frameId: 7, expressions: ['user.name'] }),
  );
  await reply('watch', {
    watches: [{ expression: 'user.name', value: "'Alice'", available: true }],
  });
  expect(await result.current.hover('user.name')).toBe("'Alice'");
  expect(await result.current.hover('user.name()')).toBeUndefined();
  expect(result.current.addWatch('arr[-1]')).toBe(false);
  const calls = execute.mock.calls.length;
  debug = {
    ...debug,
    canInspect: false,
    session: { ...debug.session!, stopId: '', state: 'running' },
  };
  await act(async () => rerender());
  expect(result.current.watches).toEqual({});
  expect(await result.current.hover('user.name')).toBeUndefined();
  expect(execute).toHaveBeenCalledTimes(calls);
});
