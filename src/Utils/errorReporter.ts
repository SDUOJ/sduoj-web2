export type ErrorReportSource = 'error-boundary' | 'window-error' | 'unhandledrejection' | 'api';

export type ErrorReport = {
  releaseId: string;
  route: string;
  source: ErrorReportSource;
  errorType: string;
  message: string;
  stack?: string;
  componentStack?: string;
  api?: {
    method?: string;
    path: string;
    status?: number;
  };
  timestamp: string;
};

export type ErrorReporterAdapter = (report: ErrorReport) => void | Promise<void>;

type ErrorReportOptions = {
  source: ErrorReportSource;
  error?: unknown;
  componentStack?: string;
  api?: ErrorReport['api'];
};

const DEFAULT_SAMPLE_RATE = 0.1;
const MAX_TEXT_LENGTH = 1200;
const SENSITIVE_QUERY_KEYS =
  /([?&](?:token|access_token|authorization|auth|password|passwd|secret|key|code|ticket|service)=)[^&#\s]*/gi;
const SENSITIVE_HEADERS = /(bearer\s+)[^\s,;]+/gi;
const SENSITIVE_JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

let adapter: ErrorReporterAdapter | undefined;
let globalHandlersInstalled = false;
let sampleRateOverride: number | undefined;

const clampSampleRate = (value: number) => Math.min(1, Math.max(0, value));

const configuredSampleRate = () => {
  if (sampleRateOverride !== undefined) return sampleRateOverride;
  const configured = Number(process.env.REACT_APP_ERROR_REPORT_SAMPLE_RATE);
  return Number.isFinite(configured) ? clampSampleRate(configured) : DEFAULT_SAMPLE_RATE;
};

const redact = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value
    .replace(SENSITIVE_QUERY_KEYS, '$1[REDACTED]')
    .replace(SENSITIVE_HEADERS, '$1[REDACTED]')
    .replace(SENSITIVE_JWT, '[REDACTED]')
    .slice(0, MAX_TEXT_LENGTH);
};

const currentRoute = () => {
  if (typeof window === 'undefined') return '/';
  return window.location.pathname || '/';
};

const releaseId = () =>
  process.env.REACT_APP_RELEASE_ID || process.env.REACT_APP_GIT_SHA || 'development';

const normalizeError = (error: unknown): { errorType: string; message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      errorType: error.name || 'Error',
      message: redact(error.message || error.name || 'Unknown error'),
      stack: redact(error.stack),
    };
  }
  if (typeof error === 'string') return { errorType: 'Error', message: redact(error) };
  if (error && typeof error === 'object') {
    const candidate = error as { name?: unknown; message?: unknown; stack?: unknown };
    return {
      errorType: typeof candidate.name === 'string' ? redact(candidate.name) : 'Error',
      message: redact(candidate.message) || 'Unknown error',
      stack: redact(candidate.stack),
    };
  }
  return { errorType: 'Error', message: 'Unknown error' };
};

const classifyError = (errorType: string, message: string) => {
  if (
    /chunk|loading css|failed to fetch dynamically imported module/i.test(`${errorType} ${message}`)
  ) {
    return 'ChunkLoadError';
  }
  return errorType || 'Error';
};

const shouldSample = () => Math.random() < configuredSampleRate();

export const setErrorReporterAdapter = (nextAdapter?: ErrorReporterAdapter) => {
  adapter = nextAdapter;
};

export const setErrorReporterSampleRateForTesting = (rate?: number) => {
  sampleRateOverride = rate === undefined ? undefined : clampSampleRate(rate);
};

export const createErrorReport = (options: ErrorReportOptions): ErrorReport => {
  const normalized = normalizeError(options.error);
  const report: ErrorReport = {
    releaseId: redact(releaseId()) || 'development',
    route: currentRoute(),
    source: options.source,
    errorType: classifyError(normalized.errorType, normalized.message),
    message: normalized.message,
    timestamp: new Date().toISOString(),
  };
  if (normalized.stack) report.stack = normalized.stack;
  if (options.componentStack) report.componentStack = redact(options.componentStack);
  if (options.api) {
    report.api = {
      ...options.api,
      path: sanitizeApiPath(options.api.path),
    };
  }
  return report;
};

export const sanitizeApiPath = (value: string) => {
  try {
    const parsed = new URL(
      value,
      typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
    );
    return parsed.pathname || '/';
  } catch {
    return redact(value.split(/[?#]/, 1)[0]) || '/';
  }
};

export const reportError = (options: ErrorReportOptions) => {
  if (!shouldSample() || !adapter) return;
  const report = createErrorReport(options);
  try {
    const result = adapter(report);
    if (result && typeof (result as Promise<void>).catch === 'function') {
      void (result as Promise<void>).catch(() => undefined);
    }
  } catch {
    // Reporting must never break the application.
  }
};

export const reportApiFailure = (error: unknown, url: string, method?: string) => {
  const candidate = error as { response?: { status?: unknown } } | undefined;
  const status = Number(candidate?.response?.status);
  reportError({
    source: 'api',
    error,
    api: {
      method: method?.toUpperCase(),
      path: sanitizeApiPath(url),
      status: Number.isFinite(status) && status > 0 ? status : undefined,
    },
  });
};

export const installGlobalErrorHandlers = () => {
  if (typeof window === 'undefined' || globalHandlersInstalled) return () => undefined;
  const onError = (event: ErrorEvent) => {
    reportError({ source: 'window-error', error: event.error || event.message });
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    reportError({ source: 'unhandledrejection', error: event.reason });
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  globalHandlersInstalled = true;
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    globalHandlersInstalled = false;
  };
};
