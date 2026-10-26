import { useCallback, useEffect, useRef, useState } from 'react';
import debugApi, { DebugSnapshot } from '../../Utils/API/ide-debug';
import type { IdeContext, IdeLanguage } from '../../Utils/API/ide-intelligence';

const ended = (value?: DebugSnapshot) =>
  !value || ['terminated', 'failed', 'expired', 'lost'].includes(value.state);
const id = () =>
  'cmd-' +
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
const compileFailures = new Set([
  'DEBUG_COMPILE_FAILED',
  'DEBUG_COMPILE_TIMEOUT',
  'DEBUG_COMPILE_MEMORY_LIMIT',
  'DEBUG_COMPILE_OUTPUT_LIMIT',
  'DEBUG_COMPILE_SANDBOX_FAILED',
  'DEBUG_COMPILEERROR',
]);
const compileFailure = (code?: string) => (code && compileFailures.has(code) ? code : undefined);
export const debugMessage = (code?: string) =>
  (
    ({
      DEBUG_COMPILE_FAILED: '编译失败，请检查程序和编译输出。',
      DEBUG_COMPILEERROR: '编译失败，请检查程序和编译输出。',
      DEBUG_COMPILE_TIMEOUT: '编译超时，请检查程序后重新调试。',
      DEBUG_COMPILE_MEMORY_LIMIT: '编译内存超限，请检查程序后重新调试。',
      DEBUG_COMPILE_OUTPUT_LIMIT: '编译输出超限，请检查程序后重新调试。',
      DEBUG_COMPILE_SANDBOX_FAILED: '编译沙箱暂不可用，请联系管理员或稍后重试。',
      DEBUG_RUN_TIMEOUT: '调试器运行超时，已释放本次调试现场。',
      DEBUG_RESUME_UNAVAILABLE: '之前的调试现场已失效，请重新启动。',
      DEBUG_RESOURCE_WAIT_TIMEOUT: '等待资源超时，已有调试现场已保留，请重试。',
      DEBUG_USER_ALREADY_HAS_SESSION: '你已有一个调试现场，请先停止后再启动。',
      DEBUG_CONTEXT_FORBIDDEN: '当前题目暂不允许调试。',
      DEBUG_TOOLCHAIN_NOT_VERIFIED: '所选语言环境尚未开放调试。',
      DEBUG_COMMAND_IN_FLIGHT: '上一次操作正在处理，请等待结果。',
      DEBUG_STATE_CONFLICT: '调试状态已更新，请稍后重试。',
      DEBUG_STALE_STOP: '程序已移动到新的停点，请重新选择调用栈。',
      DEBUG_SESSION_LOST: '调试现场已释放，请重新启动。',
      DEBUG_SESSION_MAX_AGE: '本次调试已达到30分钟，请重新启动。',
      DEBUG_SESSION_IDLE_EXPIRED: '调试因5分钟未操作而结束，请重新启动。',
      DEBUG_CLEANUP_UNCONFIRMED: '调试现场暂时无法确认回收，请联系管理员。',
      DEBUG_STDIN_BUFFER_FULL: '程序尚未读取之前的输入，请继续运行后再发送。',
      DEBUG_CANCELLED: '已取消等待，已有调试现场保留。',
    }) as Record<string, string>
  )[code ?? ''] ?? '调试暂不可用，请稍后重试。';

export default function useIdeDebug(props: {
  enabled: boolean;
  language: IdeLanguage;
  judgeTemplateId?: string;
  problemCode?: string;
  context: IdeContext;
  code: string;
  storageKey?: string;
  restoreEnabled?: boolean;
  restoreSource?: (code: string, template: string) => void;
}) {
  const [available, setAvailable] = useState(false);
  const [session, setSession] = useState<DebugSnapshot>();
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState('');
  const [compileError, setCompileError] = useState<string>();
  const compileErrorRef = useRef<string>();
  const compileTruncated = useRef(false);
  const [commandHistory, setCommandHistory] = useState('');
  const [watchExpressions, setWatchExpressions] = useState<string[]>([]);
  const cursorSeen = useRef(0);
  const outputRef = useRef('');
  const restoredKey = useRef('');
  const latest = useRef(props);
  latest.current = props;
  const [sending, setSending] = useState(false);
  const current = useRef(session);
  current.current = session;
  const [threadId, setThreadId] = useState(1);
  const thread = useRef(1);
  const generation = useRef(0);
  const frozenCode = useRef('');
  const sendingRef = useRef(false);
  const accept = useCallback((next: DebugSnapshot, replace = false) => {
    const previous = current.current;
    if (previous && previous.sessionId !== next.sessionId && !replace) return;
    if (
      previous?.sessionId === next.sessionId &&
      (previous.stateVersion > next.stateVersion ||
        (previous.stateVersion === next.stateVersion && previous.cursor > next.cursor) ||
        (ended(previous) && !ended(next)))
    )
      return;
    current.current = next;
    setSession(next);
    const failure = compileFailure(next.reason);
    if (failure) {
      compileErrorRef.current = failure;
      setCompileError(failure);
      setNotice(debugMessage(failure));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setAvailable(false);
    if (props.enabled && props.judgeTemplateId) {
      debugApi.capabilities(controller.signal).then(({ data }) => {
        if (!controller.signal.aborted)
          setAvailable(
            Boolean(
              data?.enabled &&
              data.protocolVersion === 2 &&
              Array.isArray(data.languages) &&
              Array.isArray(data.templateIds) &&
              data.languages.includes(props.language) &&
              data.templateIds.includes(props.judgeTemplateId!),
            ),
          );
      });
    }
    return () => {
      controller.abort();
    };
  }, [props.enabled, props.language, props.judgeTemplateId]);

  useEffect(() => {
    const key = props.storageKey;
    if (!key || !available || props.restoreEnabled === false || restoredKey.current === key) return;
    restoredKey.current = key;
    let alive = true;
    void (async () => {
      try {
        const cached = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (
          !cached ||
          cached.schema !== 1 ||
          typeof cached.code !== 'string' ||
          cached.code.length > 262144 ||
          cached.problemCode !== latest.current.problemCode ||
          JSON.stringify(cached.context) !== JSON.stringify(latest.current.context) ||
          cached.templateId !== latest.current.judgeTemplateId ||
          cached.language !== latest.current.language
        )
          return;
        const stored = cached.session as DebugSnapshot | undefined;
        if (
          !stored ||
          ended(stored) ||
          !/^[A-Za-z0-9_-]{16,80}$/.test(stored.sessionId) ||
          !/^[A-Za-z0-9_-]{16,80}$/.test(stored.sessionEpoch)
        )
          return;
        sendingRef.current = true;
        setSending(true);
        const reply = await debugApi.create({
          commandId: id(),
          language: cached.language,
          judgeTemplateId: cached.templateId,
          problemCode: cached.problemCode,
          context: cached.context,
          code: cached.code,
          input: '',
          breakpoints: [],
          restoreOnly: true,
          resumeSessionId: stored.sessionId,
          resumeSessionEpoch: stored.sessionEpoch,
        });
        if (!alive) return;
        if (!reply.data) {
          setNotice(debugMessage(reply.error));
          localStorage.removeItem(key);
          return;
        }
        frozenCode.current = cached.code;
        cursorSeen.current =
          Number.isSafeInteger(cached.cursor) &&
          cached.cursor >= 0 &&
          cached.cursor <= reply.data.cursor
            ? cached.cursor
            : 0;
        outputRef.current = typeof cached.output === 'string' ? cached.output.slice(-65536) : '';
        setOutput(outputRef.current);
        setCommandHistory(typeof cached.history === 'string' ? cached.history.slice(-65536) : '');
        setBreakpoints(reply.data.breakpoints ?? []);
        setWatchExpressions(
          Array.isArray(cached.watches)
            ? cached.watches
                .filter((v: unknown) => typeof v === 'string' && v.length <= 128)
                .slice(0, 16)
            : [],
        );
        latest.current.restoreSource?.(cached.code, cached.templateId);
        accept(reply.data, true);
      } catch {
        /* Invalid or unavailable browser storage never grants a session. */
      } finally {
        sendingRef.current = false;
        if (alive) setSending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [available, props.storageKey, props.restoreEnabled, accept]);

  useEffect(() => {
    if (!props.storageKey || !session) return;
    try {
      if (ended(session)) {
        localStorage.removeItem(props.storageKey);
        return;
      }
      localStorage.setItem(
        props.storageKey,
        JSON.stringify({
          schema: 1,
          session: {
            sessionId: session.sessionId,
            sessionEpoch: session.sessionEpoch,
            state: session.state,
          },
          code: frozenCode.current,
          cursor: cursorSeen.current,
          output,
          history: commandHistory,
          watches: watchExpressions,
          problemCode: props.problemCode,
          context: props.context,
          language: session.language,
          templateId: session.templateId,
        }),
      );
    } catch {
      /* Server ownership and expiry remain authoritative. */
    }
  }, [
    session,
    output,
    commandHistory,
    watchExpressions,
    props.storageKey,
    props.problemCode,
    props.context,
  ]);

  useEffect(() => {
    const epoch = ++generation.current;
    const controller = new AbortController();
    const sessionId = session?.sessionId;
    if (!sessionId || ended(session))
      return () => {
        controller.abort();
      };
    let cursor = cursorSeen.current;
    const poll = async () => {
      while (!controller.signal.aborted && epoch === generation.current) {
        const known = current.current?.sessionId === sessionId ? current.current : undefined;
        const reply = await debugApi.events(
          sessionId,
          cursor,
          controller.signal,
          known ? { stateVersion: known.stateVersion, busy: known.busy } : undefined,
        );
        if (controller.signal.aborted || epoch !== generation.current) return;
        if (!reply.data) {
          if (reply.error?.includes('LOST') || reply.error?.includes('ENDED')) {
            if (!compileErrorRef.current) setNotice('调试现场已释放，请重新启动。');
            setSession(undefined);
            return;
          }
          // One bounded backoff; polling never refreshes server idle TTL.
          await new Promise<void>((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        const { snapshot, events, truncated } = reply.data;
        cursor = reply.data.cursor ?? snapshot.cursor;
        cursorSeen.current = cursor;
        if (typeof snapshot.threadId === 'number') {
          thread.current = snapshot.threadId;
          setThreadId(snapshot.threadId);
        }
        accept(snapshot);
        if (truncated && !compileErrorRef.current)
          setNotice('部分输出已截断，已同步当前调试状态。');
        for (const event of events) {
          if (event.type === 'output' || event.type === 'compileError') {
            // Only the public compiler/program output field belongs in the terminal.
            // Private guardian stderr and raw diagnostic fields are never displayed.
            const publicOutput = event.data.output;
            if (typeof publicOutput === 'string')
              setOutput((old) => (old + publicOutput).slice(-65536));
          }
          if (event.type === 'compileError') {
            const failure =
              compileFailure(typeof event.data.code === 'string' ? event.data.code : undefined) ??
              'DEBUG_COMPILE_FAILED';
            compileErrorRef.current = failure;
            setCompileError(failure);
            if (event.data.truncated === true) compileTruncated.current = true;
            setNotice(
              debugMessage(failure) + (compileTruncated.current ? ' 编译输出已截断。' : ''),
            );
          }
          if (event.type === 'stopped' && typeof event.data.threadId === 'number') {
            thread.current = event.data.threadId;
            setThreadId(event.data.threadId);
          }
        }
        if (ended(snapshot)) {
          if (compileErrorRef.current) {
            setNotice(
              debugMessage(compileErrorRef.current) +
                (compileTruncated.current ? ' 编译输出已截断。' : ''),
            );
            return;
          }
          if (snapshot.reason !== 'DEBUG_USER_STOP')
            setNotice(
              [
                'DEBUG_RUN_TIMEOUT',
                'DEBUG_SESSION_MAX_AGE',
                'DEBUG_SESSION_IDLE_EXPIRED',
                'DEBUG_CLEANUP_UNCONFIRMED',
              ].includes(snapshot.reason)
                ? debugMessage(snapshot.reason)
                : '调试已结束，请重新启动。',
            );
          return;
        }
      }
    };
    void poll();
    return () => {
      controller.abort();
    };
    // Each session has exactly one polling owner. State changes update current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.sessionId]);

  const start = useCallback(
    async (input: string) => {
      if (
        !props.judgeTemplateId ||
        !props.problemCode ||
        sendingRef.current ||
        !ended(current.current)
      )
        return;
      sendingRef.current = true;
      setSending(true);
      setNotice('');
      compileErrorRef.current = undefined;
      compileTruncated.current = false;
      setCompileError(undefined);
      setOutput((old) =>
        (old + '\n── Debug ──\n' + (input ? '> ' + input + '\n' : '')).slice(-65536),
      );
      const request = {
        commandId: id(),
        language: props.language,
        judgeTemplateId: props.judgeTemplateId,
        problemCode: props.problemCode,
        context: props.context,
        code: props.code,
        input,
        breakpoints,
        replaceExisting: true,
      };
      const reply = await debugApi.create(request);
      // An HTTP timeout does not prove that create failed. Reconcile once;
      // never silently start/restart another program after a lost acknowledgement.
      const restored = reply.data ?? (await debugApi.create(request)).data;
      if (restored) {
        frozenCode.current = props.code;
        cursorSeen.current = 0;
        accept(restored, true);
      } else {
        const failure = compileFailure(reply.error);
        if (failure) {
          compileErrorRef.current = failure;
          setCompileError(failure);
        }
        setNotice(debugMessage(reply.error));
      }
      sendingRef.current = false;
      setSending(false);
    },
    [props, breakpoints, accept],
  );

  const execute = useCallback(
    async (operation: string, args: Record<string, unknown> = {}) => {
      const value = current.current;
      if (
        !value ||
        ended(value) ||
        sendingRef.current ||
        (operation !== 'stdin' && (value.state !== 'stopped' || value.busy))
      )
        return;
      sendingRef.current = true;
      setSending(true);
      setNotice('');
      const commandId = id();
      const reply = await debugApi.command(value, operation, args, commandId);
      if (reply.data) accept(reply.data);
      else
        setNotice(
          reply.error ? debugMessage(reply.error) : '未收到确认，正在同步状态；请勿重复点击单步。',
        );
      sendingRef.current = false;
      setSending(false);
      return reply.data ? commandId : undefined;
    },
    [accept],
  );
  const control = useCallback(
    async (operation: 'pause' | 'stop') => {
      const value = current.current;
      if (!value) return;
      // Stop/pause remain available while an ordinary command is queued/running.
      const reply = await debugApi.control(value, operation);
      if (reply.data) accept(reply.data);
      else setNotice(reply.error ? debugMessage(reply.error) : '控制请求未确认，请稍后重试。');
      if (reply.data?.state === 'lost') setNotice(debugMessage('DEBUG_CLEANUP_UNCONFIRMED'));
      return reply.data?.state === 'terminated';
    },
    [accept],
  );
  const cancel = useCallback(async () => {
    const value = current.current;
    if (!value?.ticket) return;
    const reply = await debugApi.cancel(value);
    if (reply.data) accept(reply.data);
  }, [accept]);
  const updateBreakpoints = useCallback(
    async (next: number[]) => {
      if (
        next.length > 128 ||
        next.some((line) => !Number.isInteger(line) || line < 1 || line > 100000)
      )
        return;
      if (!ended(current.current)) {
        const command = await execute('setBreakpoints', { lines: next });
        if (!command) return;
      }
      setBreakpoints(Array.from(new Set(next)).sort((a, b) => a - b));
    },
    [execute],
  );
  const toggleBreakpoint = useCallback(
    (line: number) =>
      updateBreakpoints(
        breakpoints.includes(line) ? breakpoints.filter((n) => n !== line) : [...breakpoints, line],
      ),
    [breakpoints, updateBreakpoints],
  );
  const writeInput = useCallback(
    async (text: string) => {
      const command = await execute('stdin', { text });
      if (command) setOutput((old) => (old + text).slice(-65536));
      return command;
    },
    [execute],
  );
  return {
    available,
    commandHistory,
    setCommandHistory,
    watchExpressions,
    setWatchExpressions,
    session,
    breakpoints,
    output,
    notice,
    noticeType: compileError ? ('error' as const) : ('info' as const),
    sending,
    start,
    execute,
    control,
    toggleBreakpoint,
    updateBreakpoints,
    writeInput,
    clearOutput: () => setOutput(''),
    cancel,
    threadId,
    active: !ended(session),
    canInspect: session?.state === 'stopped' && !session.busy && !sending,
    sourceChanged:
      !ended(session) &&
      (frozenCode.current !== props.code ||
        session?.templateId !== props.judgeTemplateId ||
        session?.language !== props.language),
  };
}

export type IdeDebugController = ReturnType<typeof useIdeDebug>;
