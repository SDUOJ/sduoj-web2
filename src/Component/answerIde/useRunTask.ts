import { useCallback, useEffect, useRef, useState } from 'react';
import cApi from '../../Utils/API/c-api';
import { ApiRequestError } from '../../Utils/API/request';
import i18n from '../../Config/i18n';
import { IdeContext, RunDetail, RunRequest, runTerminal } from './runTypes';

/** REST is authoritative. A new scope/cancel invalidates all outstanding responses. */
export function useRunTask(identity: string, context?: IdeContext, enabled = true) {
  const [detail, setDetail] = useState<RunDetail>();
  const [id, setId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [recovering, setRecovering] = useState(enabled && Boolean(context));
  const [globalActive, setGlobalActive] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const contextKey = JSON.stringify(context);
  const contextRef = useRef(context);
  contextRef.current = context;
  const generation = useRef(0);
  const requesting = useRef<number>();
  const inFlight = useRef(false);
  const lastCreation = useRef<{ payload: string; key: string; expires: number }>();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const storageKey = `answerIde:active:${identity}`;
  const invalidate = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    return generation.current;
  }, []);
  const poll = useCallback(
    function query(taskId: string, epoch: number) {
      if (!enabled || generation.current !== epoch || requesting.current === epoch) return;
      clearTimeout(timer.current);
      requesting.current = epoch;
      void cApi
        .getRunQuery({ submissionId: taskId })
        .then((data) => {
          if (requesting.current === epoch) requesting.current = undefined;
          if (generation.current !== epoch) return;
          setDetail(data);
          setError(undefined);
          const complete = runTerminal(data.judgeResult);
          setBusy(!complete);
          inFlight.current = !complete;
          if (complete) setGlobalActive(false);
          else timer.current = setTimeout(() => query(taskId, epoch), 1000);
        })
        .catch((error: unknown) => {
          if (requesting.current === epoch) requesting.current = undefined;
          if (generation.current !== epoch) return;
          if (
            error instanceof ApiRequestError &&
            [400, 401, 403, 404, 410].includes(
              error.status === 200 ? (error.code ?? 0) : (error.status ?? 0),
            )
          ) {
            inFlight.current = false;
            setBusy(false);
            setGlobalActive(false);
            setId(undefined);
            setDetail(undefined);
            setError(i18n.t('answerIde.taskUnavailable'));
            try {
              localStorage.removeItem(storageKey);
            } catch {
              /* Recovery must also end when optional storage is unavailable. */
            }
            return;
          }
          setError(i18n.t('answerIde.connectionError'));
          timer.current = setTimeout(() => query(taskId, epoch), 3000);
        });
    },
    [storageKey, enabled],
  );
  useEffect(() => {
    const epoch = invalidate();
    setDetail(undefined);
    setId(undefined);
    setBusy(false);
    inFlight.current = false;
    lastCreation.current = undefined;
    setError(undefined);
    setRecovering(enabled && Boolean(contextRef.current));
    setGlobalActive(false);
    setCooldownUntil(0);
    if (!enabled) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch {
      /* Storage can be disabled. */
    }
    const restoreLocal = () => {
      if (saved && /^[0-9a-f]{1,16}$/i.test(saved)) {
        setId(saved);
        setBusy(true);
        inFlight.current = true;
        poll(saved, epoch);
      }
    };
    if (contextRef.current) {
      void cApi
        .getLatestRun(contextRef.current)
        .then((recovery) => {
          if (generation.current !== epoch) return;
          setGlobalActive(recovery.hasActiveRun);
          setCooldownUntil(recovery.cooldownUntil ?? 0);
          if (recovery.detail) {
            setId(recovery.detail.submissionId);
            setDetail(recovery.detail);
            const active = !runTerminal(recovery.detail.judgeResult);
            setBusy(active);
            inFlight.current = active;
            try {
              localStorage.setItem(storageKey, recovery.detail.submissionId);
            } catch {
              /* Optional. */
            }
            if (active) poll(recovery.detail.submissionId, epoch);
          } else restoreLocal();
        })
        .catch(() => {
          if (generation.current !== epoch) return;
          restoreLocal();
          setError(i18n.t('answerIde.recoveryError'));
        })
        .finally(() => {
          if (generation.current === epoch) setRecovering(false);
        });
    } else restoreLocal();
    return () => {
      invalidate();
    };
  }, [storageKey, contextKey, invalidate, poll, enabled]);
  const start = useCallback(
    async (request: RunRequest) => {
      if (!enabled || inFlight.current || recovering || globalActive || cooldownUntil > Date.now())
        return;
      inFlight.current = true;
      const epoch = invalidate();
      setBusy(true);
      setError(undefined);
      setDetail(undefined);
      setId(undefined);
      try {
        const payload = JSON.stringify(request);
        const previous = lastCreation.current;
        const key =
          request.clientRequestId ??
          (previous?.payload === payload && previous.expires > Date.now()
            ? previous.key
            : typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : `run-${Date.now()}-${Math.random().toString(36).slice(2)}`);
        lastCreation.current = { payload, key, expires: Date.now() + 10000 };
        const taskId = await cApi.runCases({ ...request, clientRequestId: key });
        lastCreation.current = undefined;
        if (generation.current !== epoch) return;
        setId(taskId);
        setNow(Date.now());
        setCooldownUntil(Date.now() + 30000);
        setGlobalActive(true);
        try {
          localStorage.setItem(storageKey, taskId);
        } catch {
          /* Optional resume storage. */
        }
        poll(taskId, epoch);
      } catch {
        if (generation.current === epoch) {
          setBusy(false);
          inFlight.current = false;
          setError(i18n.t('answerIde.createError'));
        }
      }
    },
    [enabled, invalidate, poll, storageKey, recovering, globalActive, cooldownUntil],
  );
  const cancel = useCallback(async () => {
    if (!enabled || !id) return;
    const epoch = invalidate();
    try {
      await cApi.cancelRun({ submissionId: id });
    } catch {
      if (generation.current === epoch) setError(i18n.t('answerIde.cancelError'));
    }
    if (generation.current === epoch) poll(id, epoch);
  }, [enabled, id, invalidate, poll]);
  const refresh = useCallback(() => {
    if (enabled && id && inFlight.current) poll(id, generation.current);
  }, [enabled, id, poll]);
  useEffect(() => {
    if (!enabled || cooldownUntil <= Date.now()) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [enabled, cooldownUntil]);
  useEffect(() => {
    if (!enabled || !contextRef.current || !globalActive || busy || recovering) return;
    const check = setInterval(() => {
      const epoch = generation.current;
      void cApi
        .getLatestRun(contextRef.current!)
        .then((value) => {
          if (generation.current !== epoch) return;
          setGlobalActive(value.hasActiveRun);
          setCooldownUntil(value.cooldownUntil ?? 0);
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(check);
  }, [enabled, globalActive, busy, recovering, contextKey]);
  const cooldown = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  return {
    detail,
    id,
    busy,
    recovering,
    cooldown,
    blocked: !enabled || busy || recovering || globalActive || cooldown > 0,
    error,
    start,
    cancel,
    refresh,
  };
}
