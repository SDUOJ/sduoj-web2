import { service } from './request';

export type IdeLanguage = 'c' | 'cpp' | 'java' | 'python';

export interface IdeContext {
  type: 0 | 1 | 2;
  bizId?: string;
  problemCode?: string;
  groupIndex?: number;
  problemIndex?: number;
}

export interface IdeCapabilities {
  enabled: boolean;
  protocolVersion: number;
  providerVersion: string;
  languages: IdeLanguage[];
  features: string[];
  sessionTtlSeconds: number;
  maxCodeBytes: number;
  maxEdits: number;
  maxRequestBytes: number;
}

export interface IdeSession {
  sessionId: string;
  reused: boolean;
  revision: number;
  sessionEpoch: string;
  expiresAt: number;
  documentUri: string;
  language: IdeLanguage;
  features: string[];
  toolchain?: {
    templateId?: string;
    templateVersion?: number;
    profileHash?: string;
    alignment: 'template-configured' | 'legacy-default';
    runtimeVerified: boolean;
    stdlibAlignment?: 'not-verified';
  };
}

export type IdeSyncResult = {
  sessionId: string;
  revision: number;
  expiresAt: number;
  conflict?: boolean;
  expired?: boolean;
};

export interface IdeDiagnostic {
  source: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  code?: string;
}

export interface IdeRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
export type IdeDocumentation = string | { kind: 'markdown' | 'plaintext'; value: string };
export interface IdeSignatureResult {
  revision?: number;
  status: string;
  expired?: boolean;
  signatures?: Array<{
    label: string;
    documentation?: IdeDocumentation;
    activeParameter?: number;
    parameters?: Array<{ label: string | [number, number]; documentation?: IdeDocumentation }>;
  }>;
  activeSignature?: number;
  activeParameter?: number;
}
export interface IdeCompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: IdeDocumentation;
  insertText?: string;
  sortText?: string;
  filterText?: string;
  preselect?: boolean;
  insertTextFormat?: number;
  insertTextMode?: number;
  commitCharacters?: string[];
  insertRange?: IdeRange;
  replaceRange?: IdeRange;
  additionalTextEdits?: Array<{ range: IdeRange; text: string }>;
}

// Every IDE request in this browser tab shares one start-time gate. This optional
// provider bypasses global error toasts, redirects and error reporting.
let tail: Promise<unknown> = Promise.resolve();
let lastStart = -Infinity;
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const quietRequest = <T>(
  method: 'get' | 'post',
  url: string,
  body?: unknown,
  allowConflict = false,
  valid: () => boolean = () => true,
): Promise<T | null> => {
  const result = tail.then(async () => {
    if (!valid()) return null;
    while (performance.now() - lastStart < 300) {
      await pause(Math.ceil(300 - (performance.now() - lastStart)));
      if (!valid()) return null;
    }
    lastStart = performance.now();
    try {
      const response = await service.request({ method, url, data: body, timeout: 5000 });
      const envelope = response.data;
      return envelope && envelope.code === 0 ? ((envelope.data ?? null) as T | null) : null;
    } catch (error) {
      if (allowConflict) {
        const response = (
          error as {
            response?: { status: number; data?: { detail?: { serverRevision?: number } } };
          }
        ).response;
        const revision = response?.data?.detail?.serverRevision;
        if (response?.status === 410) return { expired: true } as T;
        if (response?.status === 409 && Number.isSafeInteger(revision) && revision! >= 1)
          return { conflict: true, revision } as T;
      }
      return null;
    }
  });
  tail = result;
  return result;
};
const request = {
  get: <T>(url: string) => quietRequest<T>('get', url),
  post: <T>(url: string, body: unknown) => quietRequest<T>('post', url, body),
};

const ideApi = {
  capabilities: () => request.get<IdeCapabilities>('/ps/ide/capabilities'),
  createSession: (body: {
    protocolVersion: number;
    clientSessionKey: string;
    language: IdeLanguage;
    problemCode?: string;
    judgeTemplateId?: string;
    context: IdeContext;
    code: string;
    documentName?: string;
  }) => request.post<IdeSession>('/ps/ide/session', body),
  sync: (sessionId: string, body: { baseRevision: number; revision: number; code: string }) =>
    quietRequest<IdeSyncResult>(
      'post',
      `/ps/ide/session/${encodeURIComponent(sessionId)}/sync`,
      body,
      true,
    ),
  state: (sessionId: string) =>
    quietRequest<IdeSyncResult>(
      'post',
      `/ps/ide/session/${encodeURIComponent(sessionId)}/state`,
      {},
      true,
    ),
  completion: (
    sessionId: string,
    body: {
      revision: number;
      line: number;
      column: number;
      triggerKind?: string;
      triggerCharacter?: string;
    },
    valid?: () => boolean,
  ) =>
    quietRequest<{
      revision: number;
      status: string;
      expired?: boolean;
      isIncomplete?: boolean;
      items?: IdeCompletionItem[];
    }>('post', `/ps/ide/session/${encodeURIComponent(sessionId)}/completion`, body, true, valid),
  signatureHelp: (
    sessionId: string,
    body: { revision: number; line: number; column: number },
    valid?: () => boolean,
  ) =>
    quietRequest<IdeSignatureResult>(
      'post',
      '/ps/ide/session/' + encodeURIComponent(sessionId) + '/signatureHelp',
      body,
      true,
      valid,
    ),
  definition: (sessionId: string, body: { revision: number; line: number; column: number }) =>
    quietRequest<{
      revision: number;
      status: string;
      expired?: boolean;
      locations?: Array<{
        documentUri: string;
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
      }>;
    }>('post', `/ps/ide/session/${encodeURIComponent(sessionId)}/definition`, body, true),
  diagnostics: (sessionId: string, revision: number) =>
    quietRequest<{
      revision: number;
      status: string;
      expired?: boolean;
      diagnostics?: IdeDiagnostic[];
    }>('post', `/ps/ide/session/${encodeURIComponent(sessionId)}/diagnostics`, { revision }, true),
  close: (sessionId: string) =>
    request.post<{ closed: boolean }>(`/ps/ide/session/${encodeURIComponent(sessionId)}/close`, {}),
};

export default ideApi;
