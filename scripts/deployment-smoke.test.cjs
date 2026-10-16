const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { create } = require('./release-artifact.cjs');
const { smoke, validateTarget } = require('./deployment-smoke.cjs');

const target = 'http://127.0.0.1:4173/v2/';
const headers = {
  Connection: 'close',
  'Content-Security-Policy': "default-src 'self'; object-src 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(self)',
};

async function fixture(context, fault = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'sduoj-smoke-fixture-'));
  const entrypoints = ['static/js/runtime-main.123abc.js', 'static/js/main.456def.js'];
  const runtime = 'window.Vditor={};';
  const runtimeHash = crypto.createHash('sha256').update(runtime).digest('hex');
  const revision = crypto
    .createHash('sha256')
    .update(`index.min.js\0${runtimeHash}\n`)
    .digest('hex');
  const files = {
    ...Object.fromEntries(entrypoints.map((filename) => [filename, 'window.fixture=true;'])),
    'static/js/editor.worker.js': 'self.onmessage=()=>self.postMessage("ready");',
    [`vditor/${revision}/dist/index.min.js`]: runtime,
    'asset-manifest.json': JSON.stringify({
      files: Object.fromEntries(entrypoints.map((entry) => [entry, '/v2/' + entry])),
      entrypoints,
    }),
    'manifest.json': JSON.stringify({ start_url: '/v2/home' }),
  };
  const deployment = {
    environment: 'test',
    apiOrigin: 'http://127.0.0.1:4173',
    frontOrigin: 'http://127.0.0.1:4173',
    socketOrigin: 'ws://127.0.0.1:4173',
  };
  files['index.html'] =
    `<meta name="sduoj-environment" content="${encodeURIComponent(JSON.stringify(deployment))}"><div id="root"></div>${entrypoints.map((entry) => `<script src="/v2/${entry}"></script>`).join('')}`;
  for (const [filename, contents] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, filename)), { recursive: true });
    fs.writeFileSync(path.join(directory, filename), contents);
  }
  create(directory, {
    sourceRef: 'a'.repeat(40),
    publicPath: '/v2/',
    version: '0.1.0',
    releaseId: 'smoke-fixture',
    createdAt: '2026-10-04T00:00:00.000Z',
    deployment,
  });
  const manifestPath = path.join(directory, 'release-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  files['release-manifest.json'] = fs.readFileSync(manifestPath);
  if (fault.manifest) files['release-manifest.json'] = JSON.stringify(fault.manifest(manifest));
  if (fault.manifestText) files['release-manifest.json'] = fault.manifestText;
  const requests = [];
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, target).pathname;
    requests.push(pathname);
    if (fault.hang === pathname) return;
    if (fault.redirect === pathname)
      return response.writeHead(302, { Location: 'http://127.0.0.1:1/never-follow' }).end();
    const security = { ...headers };
    if (fault.missingHeader) delete security[fault.missingHeader];
    if (pathname === '/api/user/getProfile')
      return response
        .writeHead(401, {
          ...security,
          'Content-Type': fault.apiHtml ? 'text/html' : 'application/json',
        })
        .end(fault.apiHtml ? '<html>not an API</html>' : JSON.stringify({ code: 401, data: null }));
    let relative = decodeURIComponent(pathname.slice('/v2/'.length));
    if (['', 'login', '__deployment-smoke-missing-route__'].includes(relative)) {
      if (fault.deepLink && relative === 'login') return response.writeHead(404, security).end();
      relative = 'index.html';
    }
    if (fault.staticFallback && relative === 'static/js/__deployment-smoke-missing__.js')
      relative = 'index.html';
    if (!(relative in files) || relative === fault.missingAsset)
      return response.writeHead(404, security).end('not found');
    const immutable = relative.startsWith('static/') || relative.startsWith('vditor/');
    const contentType = relative.endsWith('.js')
      ? fault.assetMime || 'application/javascript'
      : relative.endsWith('.json')
        ? 'application/json'
        : 'text/html';
    response.writeHead(200, {
      ...security,
      'Content-Type': contentType,
      'Cache-Control':
        fault.cache ||
        (relative.endsWith('.worker.js')
          ? fault.workerCache || 'no-cache'
          : immutable
            ? fault.staticCache || 'public, max-age=31536000, immutable'
            : 'no-cache'),
    });
    response.end(relative === fault.tamper ? 'window.fixture=evil;' : files[relative]);
  });
  context.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', resolve);
  });
  return { manifestPath, requests };
}

test('verifies every artifact byte, deep link, missing asset and anonymous API without mutations', async (context) => {
  const { manifestPath, requests } = await fixture(context);
  const report = await smoke(target, { loopbackAudit: true, expectedManifest: manifestPath });
  assert.equal(report.status, 'verified');
  assert.equal(report.fileCount, 7);
  assert.equal(report.requests.length, 13);
  assert.equal(report.sourceRef, 'a'.repeat(40));
  assert.ok(requests.includes('/v2/login'));
  assert.ok(requests.includes('/api/user/getProfile'));
  assert.equal(JSON.stringify(report).includes('"data"'), false);
  assert.equal(
    report.requests.find((entry) => entry.path.endsWith('/editor.worker.js')).cacheControl,
    'no-cache',
  );
});

for (const cache of ['public, max-age=31536000, immutable', 'no-cache, immutable'])
  test(`rejects fixed worker cache policy ${cache}`, async (context) => {
    await fixture(context, { workerCache: cache });
    await assert.rejects(
      smoke(target, { loopbackAudit: true }),
      /must not be cached|worker must revalidate/,
    );
  });

test('rejects unsafe targets and prevents use of the loopback escape hatch for deployment', () => {
  for (const url of [
    'http://example.com/v2/',
    'https://user:secret@example.com/v2/',
    'https://example.com/v2/?token=secret',
    'https://example.com/v2/#secret',
    'https://example.com/wrong/',
  ])
    assert.throws(() => validateTarget(url, false));
  assert.throws(() => validateTarget('https://example.com/v2/', true));
  assert.throws(() => validateTarget('http://127.0.0.1:4173/v2-pre/', true));
});

for (const [label, fault, message] of [
  ['tampered chunk', { tamper: 'static/js/main.456def.js' }, /hash mismatch/],
  ['missing runtime', { missingAsset: 'static/js/runtime-main.123abc.js' }, /got 404/],
  ['broken deep link', { deepLink: true }, /got 404/],
  ['static SPA fallback', { staticFallback: true }, /expected HTTP 404/],
  ['wrong executable MIME', { assetMime: 'application/octet-stream' }, /MIME type/],
  ['bad cache policy', { cache: 'public, max-age=3600' }, /must not be cached/],
  ['mutable hashed assets', { staticCache: 'no-cache' }, /missing immutable cache policy/],
  [
    'missing security header',
    { missingHeader: 'Permissions-Policy' },
    /missing permissions-policy/,
  ],
  ['API HTML error', { apiHtml: true }, /API returned non-JSON/],
  ['redirect', { redirect: '/v2/release-manifest.json' }, /fetch failed/],
])
  test(`rejects ${label} instead of accepting an HTML root marker`, async (context) => {
    await fixture(context, fault);
    await assert.rejects(smoke(target, { loopbackAudit: true }), message);
  });

test('rejects path traversal in an untrusted remote manifest before requesting files', async (context) => {
  const { requests } = await fixture(context, {
    manifest: (manifest) => ({
      ...manifest,
      files: [{ ...manifest.files[0], path: '../secret.js' }],
    }),
  });
  await assert.rejects(smoke(target, { loopbackAudit: true }), /Unsafe/);
  assert.deepEqual(requests, ['/v2/release-manifest.json']);
});

test('rejects an unexpected staged or known-good manifest', async (context) => {
  const { manifestPath } = await fixture(context);
  fs.appendFileSync(manifestPath, ' ');
  await assert.rejects(
    smoke(target, { loopbackAudit: true, expectedManifest: manifestPath }),
    /staged artifact/,
  );
  await assert.rejects(
    smoke(target, { loopbackAudit: true, expectedSha256: 'b'.repeat(64) }),
    /known-good release/,
  );
});

test('a stalled server fails within the per-request deadline', async (context) => {
  await fixture(context, { hang: '/v2/release-manifest.json' });
  const started = Date.now();
  await assert.rejects(smoke(target, { loopbackAudit: true, requestTimeoutMs: 100 }));
  assert.ok(Date.now() - started < 2000);
});

test('a stalled server also respects the total deadline', async (context) => {
  await fixture(context, { hang: '/v2/release-manifest.json' });
  const started = Date.now();
  await assert.rejects(
    smoke(target, { loopbackAudit: true, requestTimeoutMs: 5000, overallTimeoutMs: 100 }),
  );
  assert.ok(Date.now() - started < 2000);
});

test('malformed remote JSON does not expose its raw payload in diagnostics', async (context) => {
  await fixture(context, { manifestText: 'credential-secret-sample' });
  await assert.rejects(smoke(target, { loopbackAudit: true }), (error) => {
    assert.equal(error.message, 'Invalid JSON: release manifest');
    assert.equal(error.message.includes('credential-secret-sample'), false);
    return true;
  });
});
