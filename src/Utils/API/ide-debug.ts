import { service } from './request';
import type { IdeContext, IdeLanguage } from './ide-intelligence';

export interface DebugCommand {
  commandId: string;
  operation: string;
  status: 'queued' | 'dispatched' | 'completed' | 'failed' | 'unknown';
  error?: string;
  result?: Record<string, unknown>;
}
export interface DebugSnapshot {
  sessionId: string;
  sessionEpoch: string;
  state: string;
  stateVersion: number;
  stopId: string;
  threadId: number;
  busy: boolean;
  language: IdeLanguage;
  templateId: string;
  sourceName: string;
  sourceDigest?: string;
  breakpoints?: number[];
  runLimitSeconds?: number;
  sourceLineOffset: number;
  startedAt: number | null;
  hardExpiresAt: number | null;
  idleExpiresAt: number;
  ticket: { ticketId: string; queueReason: string; queueExpiresAt: number } | null;
  commands: DebugCommand[];
  cursor: number;
  reason: string;
}
export interface DebugEvent {
  cursor: number;
  type: string;
  data: Record<string, unknown>;
}
export type DebugReply<T> = { data: T | null; error?: string };
// Separate from LSP; no global toasts, authentication redirect, telemetry, or
// automatic command retry. Reconcile a lost reply using the command ledger.
let tail: Promise<unknown> = Promise.resolve();
let lastStart = -Infinity;
async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<DebugReply<T>> {
  const gate = tail.then(async () => {
    const delay = Math.max(0, 300 - (performance.now() - lastStart));
    if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    lastStart = performance.now();
  });
  tail = gate;
  await gate;
  try {
    const response = await service.request({
      method: body === undefined ? 'get' : 'post',
      url: '/ps/ide/debug/' + path,
      data: body,
      timeout: 25_000,
      signal,
    });
    const payload = response.data;
    return payload?.code === 0
      ? { data: payload.data ?? null }
      : { data: null, error: payload?.message };
  } catch (error) {
    return {
      data: null,
      error: (error as { response?: { data?: { message?: string } } }).response?.data?.message,
    };
  }
}
const prefix = (sessionId: string) => 'session/' + encodeURIComponent(sessionId) + '/';
const debugApi = {
  capabilities: (signal?: AbortSignal) =>
    request<{
      enabled: boolean;
      protocolVersion?: number;
      languages: IdeLanguage[];
      templateIds: string[];
    }>('capabilities', undefined, signal),
  create: (body: {
    commandId: string;
    language: IdeLanguage;
    judgeTemplateId: string;
    problemCode: string;
    context: IdeContext;
    code: string;
    input: string;
    breakpoints: number[];
    replaceExisting?: boolean;
    restoreOnly?: boolean;
    resumeSessionId?: string;
    resumeSessionEpoch?: string;
  }) => request<DebugSnapshot>('session', body),
  current: () => request<DebugSnapshot>('session/current', {}),
  command: (
    session: DebugSnapshot,
    operation: string,
    args: Record<string, unknown>,
    commandId: string,
  ) =>
    request<DebugSnapshot>(prefix(session.sessionId) + 'command', {
      commandId,
      sessionEpoch: session.sessionEpoch,
      expectedStateVersion: session.stateVersion,
      stopId: session.stopId,
      operation,
      arguments: args,
    }),
  events: (
    sessionId: string,
    cursor: number,
    signal?: AbortSignal,
    known?: Pick<DebugSnapshot, 'stateVersion' | 'busy'>,
  ) =>
    request<{
      snapshot: DebugSnapshot;
      events: DebugEvent[];
      truncated: boolean;
      cursor?: number;
    }>(
      prefix(sessionId) + 'events',
      {
        cursor,
        waitSeconds: known ? 20 : 0,
        ...(known ? { knownStateVersion: known.stateVersion, knownBusy: known.busy } : {}),
      },
      signal,
    ),
  cancel: (session: DebugSnapshot) =>
    request<DebugSnapshot>(prefix(session.sessionId) + 'cancel', {
      sessionEpoch: session.sessionEpoch,
      ticketId: session.ticket?.ticketId,
    }),
  control: (session: DebugSnapshot, operation: 'pause' | 'stop') =>
    request<DebugSnapshot>(prefix(session.sessionId) + operation, {
      sessionEpoch: session.sessionEpoch,
    }),
};
export default debugApi;
