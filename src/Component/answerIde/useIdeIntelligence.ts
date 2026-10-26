import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ideApi, {
  IdeCompletionItem,
  IdeDiagnostic,
  IdeLanguage,
} from '../../Utils/API/ide-intelligence';
import type { IdeContext } from '../../Utils/API/ide-intelligence';

type Options = {
  enabled: boolean;
  language: IdeLanguage;
  problemCode: string;
  judgeTemplateId?: string;
  context: IdeContext;
  code: string;
};
type Session = { id: string; revision: number; code?: string; uncertain?: boolean };
type IdeResult =
  | Awaited<ReturnType<typeof ideApi.completion>>
  | Awaited<ReturnType<typeof ideApi.signatureHelp>>
  | Awaited<ReturnType<typeof ideApi.definition>>
  | Awaited<ReturnType<typeof ideApi.diagnostics>>;

export default function useIdeIntelligence(options: Options) {
  const identity = useMemo(
    () =>
      JSON.stringify({
        enabled: options.enabled,
        language: options.language,
        problemCode: options.problemCode,
        judgeTemplateId: options.judgeTemplateId,
        context: options.context,
      }),
    [
      options.enabled,
      options.language,
      options.problemCode,
      options.judgeTemplateId,
      options.context,
    ],
  );
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [diagnostics, setDiagnostics] = useState<IdeDiagnostic[]>([]);
  const session = useRef<Session>();
  const generation = useRef(0);
  const clientKey = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latestRead = useRef({ completion: 0, signatureHelp: 0, diagnostics: 0, definition: 0 });
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Sync and LSP operations share a serial queue. A position is never sent for
  // text that only exists in Monaco, nor can an old response mark newer text.
  const execute = useCallback(
    async (
      kind: 'completion' | 'signatureHelp' | 'definition' | 'diagnostics',
      fields: { line: number; column: number; triggerKind?: string; triggerCharacter?: string } = {
        line: 1,
        column: 1,
      },
      cancelled: () => boolean = () => false,
    ): Promise<IdeResult> => {
      const epoch = generation.current;
      const code = optionsRef.current.code;
      const ticket = ++latestRead.current[kind];
      const interactive = latestRead.current.completion + latestRead.current.signatureHelp;
      const valid = () =>
        epoch === generation.current &&
        optionsRef.current.code === code &&
        latestRead.current[kind] === ticket &&
        (kind !== 'diagnostics' ||
          interactive === latestRead.current.completion + latestRead.current.signatureHelp) &&
        !cancelled();
      if (!optionsRef.current.enabled) return null;
      const task = queue.current
        .then(async () => {
          if (!valid()) return null;
          let current = session.current;
          if (!current) {
            const created = await ideApi.createSession({
              protocolVersion: 1,
              clientSessionKey: clientKey.current,
              language: optionsRef.current.language,
              problemCode: optionsRef.current.problemCode,
              judgeTemplateId: optionsRef.current.judgeTemplateId,
              context: optionsRef.current.context,
              code,
            });
            if (!created || epoch !== generation.current) {
              if (created) void ideApi.close(created.sessionId);
              return null;
            }
            current = {
              id: created.sessionId,
              revision: created.revision,
              code: created.reused ? undefined : code,
            };
            session.current = current;
            setSessionId(current.id);
          }
          if (!valid()) return null;
          if (current.uncertain) {
            const state = await ideApi.state(current.id);
            if (!state) return null;
            if (state.expired) {
              session.current = undefined;
              setSessionId(undefined);
              return null;
            }
            current.revision = state.revision;
            current.code = undefined;
            current.uncertain = false;
          }
          if (!valid()) return null;
          if (current.code !== code) {
            let synced = await ideApi.sync(current.id, {
              baseRevision: current.revision,
              revision: current.revision + 1,
              code,
            });
            if (synced?.conflict) {
              current.revision = synced.revision;
              // A conflict did not commit this source. Keep the recovered
              // revision, but do not send an obsolete retry after new input.
              if (!valid()) return null;
              synced = await ideApi.sync(current.id, {
                baseRevision: current.revision,
                revision: current.revision + 1,
                code,
              });
            }
            if (synced?.expired) {
              session.current = undefined;
              setSessionId(undefined);
              return null;
            }
            if (!synced || synced.conflict) {
              current.uncertain = true;
              return null;
            }
            current.revision = synced.revision;
            current.code = code;
          }
          if (!valid()) return null;
          const revision = current.revision;
          const result =
            kind === 'diagnostics'
              ? await ideApi.diagnostics(current.id, revision)
              : kind === 'completion'
                ? await ideApi.completion(current.id, { revision, ...fields }, valid)
                : kind === 'signatureHelp'
                  ? await ideApi.signatureHelp(
                      current.id,
                      { revision, line: fields.line, column: fields.column },
                      valid,
                    )
                  : await ideApi.definition(current.id, {
                      revision,
                      line: fields.line,
                      column: fields.column,
                    });
          if (!valid() || session.current !== current) return null;
          // Completion, definition and diagnostics are read-only: a lost response
          // cannot make the document revision ambiguous. Only sync needs state
          // reconciliation before retrying.
          if (!result) return null;
          if (result.expired) {
            session.current = undefined;
            setSessionId(undefined);
            return null;
          }
          if (result.status === 'stale') {
            current.uncertain = true;
            return null;
          }
          if (result.revision !== revision || result.status !== 'ready') return null;
          return result;
        })
        .catch(() => null);
      queue.current = task;
      return task;
    },
    [],
  );

  useEffect(() => {
    const epoch = ++generation.current;
    session.current = undefined;
    setReady(false);
    setSessionId(undefined);
    setDiagnostics([]);
    clientKey.current =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'ide-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    if (optionsRef.current.enabled) {
      void ideApi
        .capabilities()
        .then((capabilities) => {
          if (
            epoch !== generation.current ||
            !capabilities?.enabled ||
            capabilities.protocolVersion !== 1 ||
            !capabilities.languages.includes(optionsRef.current.language)
          )
            return;
          setReady(true);
          return execute('diagnostics').then((result) => {
            if (epoch === generation.current && result && 'diagnostics' in result)
              setDiagnostics(result.diagnostics ?? []);
          });
        })
        .catch(() => undefined);
    }
    return () => {
      generation.current = epoch + 1;
      clearTimeout(timer.current);
      const current = session.current;
      session.current = undefined;
      if (current) void ideApi.close(current.id);
    };
  }, [identity, execute]);

  const syncCode = useCallback(
    (code: string) => {
      optionsRef.current = { ...optionsRef.current, code };
      clearTimeout(timer.current);
      setDiagnostics([]);
      if (!ready) return;
      const epoch = generation.current;
      timer.current = setTimeout(() => {
        void execute('diagnostics').then((result) => {
          if (
            generation.current === epoch &&
            optionsRef.current.code === code &&
            result &&
            'diagnostics' in result
          )
            setDiagnostics(result.diagnostics ?? []);
        });
      }, 600);
    },
    [ready, execute],
  );

  const completion = useCallback(
    async (
      line: number,
      column: number,
      triggerKind?: string,
      triggerCharacter?: string,
      cancelled?: () => boolean,
    ) => {
      const result = ready
        ? await execute('completion', { line, column, triggerKind, triggerCharacter }, cancelled)
        : null;
      return result && 'items' in result
        ? result
        : { status: 'degraded', isIncomplete: true, items: [] as IdeCompletionItem[] };
    },
    [ready, execute],
  );
  const signatureHelp = useCallback(
    async (line: number, column: number, cancelled?: () => boolean) => {
      const result = ready ? await execute('signatureHelp', { line, column }, cancelled) : null;
      return result && 'signatures' in result ? result : { status: 'degraded', signatures: [] };
    },
    [ready, execute],
  );
  const definition = useCallback(
    async (line: number, column: number) => {
      const result = ready ? await execute('definition', { line, column }) : null;
      return result && 'locations' in result ? result : { status: 'degraded', locations: [] };
    },
    [ready, execute],
  );
  return { ready, sessionId, diagnostics, syncCode, completion, signatureHelp, definition };
}
