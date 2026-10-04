const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCspReports, MAX_CSP_REPORT_BYTES } = require('./security-report.cjs');

test('removes credentials, query strings, fragments, samples, referrers, and source files', () => {
  assert.deepEqual(
    normalizeCspReports({
      'csp-report': {
        'effective-directive': 'script-src-elem',
        'document-uri': 'https://user:password@example.invalid/v2/home?token=secret#answer',
        'blocked-uri': 'https://user:password@blocked.invalid/private/input?token=secret',
        'status-code': 200,
        'script-sample': 'password=secret',
        'source-file': 'https://example.invalid/input?secret',
        referrer: 'https://example.invalid/secret',
        'original-policy': "script-src 'self'",
        disposition: 'enforce',
      },
    }),
    [
      {
        directive: 'script-src-elem',
        disposition: 'enforce',
        documentPath: '/v2/home',
        blockedOrigin: 'https://blocked.invalid',
        status: 200,
      },
    ],
  );
});

test('accepts modern report bodies and inline violations without storing the input', () => {
  assert.deepEqual(
    normalizeCspReports([
      {
        type: 'csp-violation',
        body: {
          effectiveDirective: 'script-src-elem',
          blockedURL: 'inline',
          documentURL: 'http://127.0.0.1:4173/v2/home?secret',
          disposition: 'report',
        },
      },
    ]),
    [
      {
        directive: 'script-src-elem',
        disposition: 'report',
        documentPath: '/v2/home',
        blockedOrigin: 'inline',
        status: undefined,
      },
    ],
  );
});

test('bounds report counts and ignores malformed report envelopes and directives', () => {
  assert.equal(MAX_CSP_REPORT_BYTES, 32768);
  for (const malformed of [
    null,
    'html',
    {},
    { 'csp-report': [] },
    { 'csp-report': { 'effective-directive': 'token=secret' } },
  ])
    assert.deepEqual(normalizeCspReports(malformed), []);
  assert.equal(
    normalizeCspReports(new Array(100).fill({ 'csp-report': { 'effective-directive': 'img-src' } }))
      .length,
    20,
  );
});
