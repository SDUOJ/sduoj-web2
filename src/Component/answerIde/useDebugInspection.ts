import { useEffect, useRef, useState } from 'react';
import type { IdeDebugController } from './useIdeDebug';

export type DebugFrame = { id: number; name: string; line: number; editableSource?: boolean };
export type DebugVariable = {
  name: string;
  value: string;
  variablesReference: number;
  children?: DebugVariable[];
};
type Job = {
  operation: string;
  arguments: Record<string, unknown>;
  path?: number[];
  done?: (value?: string) => void;
};
/** Inspect each stop in order; never evaluate expressions or retry execution commands. */
export default function useDebugInspection(debug: IdeDebugController) {
  const { session, sourceChanged, canInspect, execute, threadId } = debug;
  const [watches, setWatches] = useState<Record<string, string>>({});
  const watchRef = useRef(debug.watchExpressions);
  watchRef.current = debug.watchExpressions;
  const [frames, setFrames] = useState<DebugFrame[]>([]);
  const [variables, setVariables] = useState<DebugVariable[]>([]);
  const [frame, setFrame] = useState<DebugFrame>();
  const [job, setJob] = useState<Job>();
  const [waiting, setWaiting] = useState<Job & { id: string }>();
  const key = `${session?.sessionId}:${session?.stopId}`;
  const generation = useRef(0);
  const dispatching = useRef(false);
  useEffect(() => {
    generation.current++;
    dispatching.current = false;
    waiting?.done?.();
    setWatches({});
    setFrames([]);
    setVariables([]);
    setFrame(undefined);
    setWaiting(undefined);
    setJob(
      session?.stopId && !sourceChanged
        ? { operation: 'stackTrace', arguments: { threadId: threadId } }
        : undefined,
    );
    // A new stop invalidates all frame and variable handles from the previous stop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, sourceChanged]);
  useEffect(() => {
    if (!waiting) return;
    const command = session?.commands.find((c) => c.commandId === waiting.id);
    if (!command || !['completed', 'failed', 'unknown'].includes(command.status)) return;
    setWaiting(undefined);
    if (command.status !== 'completed' || !command.result) {
      waiting.done?.();
      if (waiting.operation === 'watch')
        setWatches((old) => ({
          ...old,
          ...Object.fromEntries(
            (waiting.arguments.expressions as string[]).map((v) => [v, '<unavailable>']),
          ),
        }));
      return;
    }
    const result = command.result;
    if (waiting.operation === 'watch') {
      const values = (result.watches ?? []) as { expression: string; value: string }[];
      setWatches((old) => ({
        ...old,
        ...Object.fromEntries(values.map((v) => [v.expression, v.value])),
      }));
      waiting.done?.(values[0]?.value);
    } else if (waiting.operation === 'stackTrace') {
      const entries = (Array.isArray(result.stackFrames) ? result.stackFrames : []) as DebugFrame[];
      setFrames(entries);
      const selected = entries.find((f) => f.editableSource) ?? entries[0];
      setFrame(selected);
      if (selected) setJob({ operation: 'scopes', arguments: { frameId: selected.id } });
    } else if (waiting.operation === 'scopes') {
      const scopes = (Array.isArray(result.scopes) ? result.scopes : []) as {
        variablesReference: number;
      }[];
      if (scopes[0])
        setJob({
          operation: 'variables',
          arguments: { variablesReference: scopes[0].variablesReference, start: 0, count: 100 },
        });
    } else if (waiting.operation === 'variables') {
      const entries = (
        (Array.isArray(result.variables) ? result.variables : []) as DebugVariable[]
      ).slice(0, 100);
      if (!waiting.path && watchRef.current?.length && frame)
        setJob({
          operation: 'watch',
          arguments: { frameId: frame.id, expressions: watchRef.current },
        });
      setVariables((old) => {
        if (!waiting.path) return entries;
        const copy = JSON.parse(JSON.stringify(old)) as DebugVariable[];
        const size = (nodes: DebugVariable[]): number =>
          nodes.reduce((n, node) => n + 1 + size(node.children ?? []), 0);
        const bounded = entries.slice(0, Math.max(0, 1000 - size(old)));
        let level = copy;
        for (const index of waiting.path.slice(0, -1)) level = level[index]?.children ?? [];
        const node = level[waiting.path[waiting.path.length - 1]];
        if (node) node.children = bounded;
        return copy;
      });
    }
  }, [waiting, session?.commands, frame]);
  useEffect(() => {
    if (!job || waiting || dispatching.current || !canInspect || sourceChanged) return;
    dispatching.current = true;
    const epoch = generation.current;
    setJob(undefined);
    void execute(job.operation, job.arguments).then((id) => {
      if (epoch !== generation.current) return;
      dispatching.current = false;
      if (id) setWaiting({ ...job, id });
      else job.done?.();
    });
  }, [job, waiting, canInspect, sourceChanged, execute]);
  useEffect(() => {
    if (!canInspect || sourceChanged || !frame || job || waiting || dispatching.current) return;
    const missing = (debug.watchExpressions ?? []).filter(
      (expression) => !Object.prototype.hasOwnProperty.call(watches, expression),
    );
    if (missing.length)
      setJob({ operation: 'watch', arguments: { frameId: frame.id, expressions: missing } });
  }, [canInspect, sourceChanged, frame, job, waiting, debug.watchExpressions, watches]);
  const busy = Boolean(job || waiting);
  return {
    frames,
    watches,
    hover: async (expression: string) => {
      if (!canInspect || sourceChanged || !safeWatch(expression)) return undefined;
      if (Object.prototype.hasOwnProperty.call(watches, expression)) return watches[expression];
      const direct = variables.find((v) => v.name === expression);
      if (direct) return direct.value;
      if (busy || !frame) return undefined;
      return new Promise<string | undefined>((resolve) => {
        const timer = setTimeout(() => resolve(undefined), 15000);
        setJob({
          operation: 'watch',
          arguments: { frameId: frame.id, expressions: [expression] },
          done: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
        });
      });
    },
    addWatch: (expression: string) => {
      if (!safeWatch(expression) || (debug.watchExpressions?.length ?? 0) >= 16) return false;
      const expressions = Array.from(new Set([...(debug.watchExpressions ?? []), expression]));
      debug.setWatchExpressions(expressions);
      if (!busy && canInspect && frame)
        setJob({ operation: 'watch', arguments: { frameId: frame.id, expressions } });
      return true;
    },
    removeWatch: (expression: string) =>
      debug.setWatchExpressions(debug.watchExpressions.filter((v) => v !== expression)),
    variables,
    frame,
    busy,
    line:
      session?.state === 'stopped' && frame?.editableSource && !sourceChanged
        ? frame.line
        : undefined,
    refresh: () => {
      if (!busy && canInspect)
        setJob({ operation: 'stackTrace', arguments: { threadId: threadId } });
    },
    select: (selected: DebugFrame) => {
      if (busy || !canInspect) return;
      setFrame(selected);
      setWatches({});
      setVariables([]);
      setJob({ operation: 'scopes', arguments: { frameId: selected.id } });
    },
    expand: (variable: DebugVariable, path: number[]) => {
      if (busy || !canInspect || path.length > 3 || !variable.variablesReference) return;
      setJob({
        operation: 'variables',
        arguments: { variablesReference: variable.variablesReference, start: 0, count: 100 },
        path,
      });
    },
  };
}
export type DebugInspection = ReturnType<typeof useDebugInspection>;

export const safeWatch = (value: string) =>
  value.length <= 128 &&
  /^[A-Za-z_$][A-Za-z0-9_$]*(?:(?:\.[A-Za-z_$][A-Za-z0-9_$]*)|(?:\[(?:0|[1-9][0-9]{0,4})\])){0,7}$/.test(
    value,
  );
