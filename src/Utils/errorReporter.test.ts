import {
  createErrorReport,
  installGlobalErrorHandlers,
  reportApiFailure,
  reportError,
  sanitizeApiPath,
  setErrorReporterAdapter,
  setErrorReporterSampleRateForTesting,
} from './errorReporter';

describe('error reporter contract', () => {
  const reports: unknown[] = [];

  beforeEach(() => {
    reports.length = 0;
    setErrorReporterAdapter((report) => {
      reports.push(report);
    });
    setErrorReporterSampleRateForTesting(1);
    window.history.pushState({}, '', '/v2/problem/7?token=hidden#answer');
  });

  afterEach(() => {
    setErrorReporterAdapter(undefined);
    setErrorReporterSampleRateForTesting(undefined);
    window.history.pushState({}, '', '/');
  });

  it('normalizes routes and redacts secrets from boundary reports', () => {
    reportError({
      source: 'error-boundary',
      error: new Error('failed https://example.test/api?token=secret-value'),
      componentStack: 'at SecretComponent (Authorization: Bearer abc.def.ghi)',
    });

    const report = reports[0] as any;
    expect(report.source).toBe('error-boundary');
    expect(report.route).toBe('/v2/problem/7');
    expect(report.errorType).toBe('Error');
    expect(report.message).toContain('[REDACTED]');
    expect(report.message).not.toContain('secret-value');
    expect(report.componentStack).not.toContain('abc.def.ghi');
    expect(report.releaseId).toBeTruthy();
  });

  it('classifies dynamic chunk errors and strips API query strings', () => {
    const report = createErrorReport({
      source: 'window-error',
      error: new Error('Loading chunk 4 failed'),
      api: { path: 'https://api.example.test/v2/items?id=7', method: 'get', status: 503 },
    });
    expect(report.errorType).toBe('ChunkLoadError');
    expect(report.api).toEqual({
      path: '/v2/items',
      method: 'get',
      status: 503,
    });
    expect(sanitizeApiPath('/api/items?password=secret')).toBe('/api/items');
  });

  it('reports only sampled events and never throws when adapter fails', () => {
    setErrorReporterSampleRateForTesting(0);
    reportError({ source: 'window-error', error: new Error('sampled out') });
    expect(reports).toHaveLength(0);

    setErrorReporterSampleRateForTesting(1);
    setErrorReporterAdapter(() => {
      throw new Error('adapter unavailable');
    });
    expect(() => reportError({ source: 'window-error', error: new Error('safe') })).not.toThrow();
  });

  it('captures window errors and unhandled rejections through the same contract', () => {
    const cleanup = installGlobalErrorHandlers();
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('window failure') }));
    const rejection = new Event('unhandledrejection');
    Object.defineProperty(rejection, 'reason', { value: 'promise failure' });
    window.dispatchEvent(rejection);
    cleanup();

    expect((reports[0] as any).source).toBe('window-error');
    expect((reports[1] as any).source).toBe('unhandledrejection');
  });

  it('includes API status and path while omitting response payloads', () => {
    reportApiFailure(
      { response: { status: 502, data: { password: 'should-not-leak' } } },
      '/api/user/profile?ticket=private',
      'post',
    );
    expect(reports[0]).toMatchObject({
      source: 'api',
      api: { method: 'POST', path: '/api/user/profile', status: 502 },
    });
    expect(JSON.stringify(reports[0])).not.toContain('should-not-leak');
  });
});
