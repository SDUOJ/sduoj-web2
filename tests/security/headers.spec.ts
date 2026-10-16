import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Report = { directive: string; documentPath?: string; blockedOrigin?: string };
const reportControlUrl = 'http://127.0.0.1:4174/__fixture/reports';

async function installApi(page: Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0 };
    if (url.pathname === '/api/user/getProfile')
      data = {
        userId: '1',
        username: 'header-fixture',
        nickname: 'Header fixture',
        studentId: '',
        roles: ['superadmin'],
        features: {},
      };
    if (url.pathname === '/api/site/getCopyright') data = 'SDUOJ';
    if (url.pathname === '/api/submit/queryACProblem') data = [];
    if (url.pathname === '/api/ps/problem_set/upcoming') data = { running: [], upcoming: [] };
    if (url.pathname === '/api/problem/query')
      data = {
        problemId: '1',
        problemCode: 'SECURITY-1',
        problemTitle: 'Header compatibility',
        timeLimit: 1000,
        memoryLimit: 262144,
        source: 'fixture',
        isAccepted: 0,
        judgeTemplates: [],
        functionTemplates: [],
        problemCaseDTOList: [],
        problemDescriptionDTO: {
          id: '1',
          markdownDescription:
            '# Header compatibility\n\n$1 + 2$\n\n```cpp\nint answer = 42;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n![local image](/v2/logo.png)',
        },
        problemDescriptionListDTOList: [{ id: '1', title: 'Default', voteNum: 0 }],
      };
    if (/\/create|\/update|\/delete/.test(url.pathname))
      throw new Error('Security fixture must not persist page content');
    await route.fulfill({ json: { code: 0, data, timestamp: Date.now() } });
  });
}

test.beforeEach(async ({ request }) => {
  expect((await request.delete(reportControlUrl, { timeout: 5000 })).status()).toBe(204);
});

test('the report endpoint bounds input and stores no raw credentials or script sample', async ({
  request,
}) => {
  const invalid = await request.post('/_security/csp', { data: 'not JSON' });
  expect(invalid.status()).toBe(400);
  const oversized = await request.post('/_security/csp', { data: 'x'.repeat(32769) });
  expect(oversized.status()).toBe(413);
  const valid = await request.post('/_security/csp', {
    data: {
      'csp-report': {
        'effective-directive': 'script-src-elem',
        'document-uri': 'https://user:password@site.invalid/v2/home?token=secret#answer',
        'blocked-uri': 'https://user:password@blocked.invalid/input?token=secret',
        'script-sample': 'sensitive-input',
        'status-code': 200,
      },
    },
  });
  expect(valid.status()).toBe(204);
  const reports = await (await request.get(reportControlUrl, { timeout: 5000 })).json();
  expect(reports).toEqual([
    {
      directive: 'script-src-elem',
      disposition: 'enforce',
      documentPath: '/v2/home',
      blockedOrigin: 'https://blocked.invalid',
      status: 200,
    },
  ]);
});

test('nginx serves security headers on HTML, cached assets, errors, API and TLS responses', async ({
  request,
}, testInfo) => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../build-test/index.html'), 'utf8');
  const script = html.match(/<script[^>]+src="([^"]+\.js)"/);
  expect(script).toBeTruthy();
  const worker = fs
    .readdirSync(path.resolve(__dirname, '../../build-test/static/js'))
    .find((filename) => /^editor\.[a-f0-9]{8}\.worker\.js$/.test(filename));
  expect(worker).toBeTruthy();
  const workerRoute = `/v2/static/js/${worker}`;
  const results: Array<{ route: string; status: number; headers: Record<string, string> }> = [];
  for (const route of [
    '/v2/login',
    '/v2/unknown-deep-link',
    script![1],
    workerRoute,
    '/v2/static/missing.js',
    '/api/user/getProfile',
  ]) {
    const response = await request.get(route);
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['content-security-policy']).toContain("script-src-attr 'none'");
    expect(headers['content-security-policy']).not.toContain('unsafe-eval');
    expect(headers['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('same-origin');
    expect(headers['permissions-policy']).toContain('camera=(self)');
    expect(headers['permissions-policy']).toContain('geolocation=()');
    expect(headers['strict-transport-security']).toBeUndefined();
    if (route === script![1]) expect(headers['cache-control']).toContain('immutable');
    if (route === workerRoute) {
      expect(response.status()).toBe(200);
      expect(headers['cache-control']).toBe('no-cache');
      expect(headers['content-type']).toContain('javascript');
    }
    if (route === '/v2/static/missing.js') expect(response.status()).toBe(404);
    if (route === '/api/user/getProfile') expect(response.status()).toBe(401);
    results.push({ route, status: response.status(), headers });
  }
  const tls = await request.get('https://127.0.0.1:9443/v2/login', { ignoreHTTPSErrors: true });
  expect(tls.headers()['strict-transport-security']).toBe('max-age=31536000');
  expect(tls.headers()['content-security-policy']).toContain('wss://127.0.0.1:9443');
  await testInfo.attach('headers', {
    contentType: 'application/json',
    body: JSON.stringify(results),
  });
});

test('real renderer and editor remain usable without CSP violations', async ({
  page,
  request,
  browserName,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installApi(page);
  await page.goto('/v2/problem/SECURITY-1');
  const content = page.locator('#problem-content');
  await expect(content.getByRole('heading', { name: 'Header compatibility' })).toBeVisible();
  await expect(content.locator('.katex').first()).toBeVisible();
  await expect(content.locator('code').first()).toContainText('answer');
  await expect(content.locator('table')).toBeVisible();
  await expect
    .poll(() => content.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await page.goto('/v2/manage/announcement');
  await page.getByRole('button', { name: /Create$/ }).click();
  const editor = page
    .getByRole('dialog')
    .locator('.vditor-ir .vditor-reset[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await editor.fill('Header policy editor smoke');
  await expect(editor).toContainText('Header policy editor smoke');
  await testInfo.attach('editor', {
    contentType: 'image/png',
    body: await page.screenshot({ path: testInfo.outputPath('editor.png') }),
  });
  const reports = (await (
    await request.get(reportControlUrl, { timeout: 5000 })
  ).json()) as Report[];
  expect(reports.every((report) => report.directive === 'script-src-attr')).toBe(true);
  expect(reports.every((report) => report.blockedOrigin === 'inline')).toBe(true);
  expect(
    reports.every((report) =>
      ['/v2/problem/SECURITY-1', '/v2/manage/announcement'].includes(report.documentPath ?? ''),
    ),
  ).toBe(true);
  expect(reports.length).toBeLessThanOrEqual(browserName === 'firefox' ? 2 : 0);
  await testInfo.attach('csp-compatibility-budget', {
    contentType: 'application/json',
    body: JSON.stringify(reports),
  });
  const permittedResize: string[] =
    browserName === 'webkit'
      ? errors.filter(
          (error) => error === 'ResizeObserver loop completed with undelivered notifications.',
        )
      : [];
  expect(permittedResize.length).toBeLessThanOrEqual(2);
  expect(errors.filter((error) => !permittedResize.includes(error))).toEqual([]);
});

test('same-origin real API, proxied WebSocket, blob worker and images are permitted', async ({
  page,
  request,
}) => {
  test.skip(process.env.SDUOJ_SECURITY_REAL_SERVICES !== '1', 'Requires the real local gateway');
  await installApi(page);
  await page.goto('/v2/login');
  await page.unroute('**/api/**');
  const api = await page.evaluate(async () => {
    const response = await fetch('/api/ps/openapi.json');
    const specification = await response.json();
    return { status: response.status, pathCount: Object.keys(specification.paths).length };
  });
  expect(api.status).toBe(200);
  expect(api.pathCount).toBeGreaterThan(100);
  const echoed = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const socket = new WebSocket(`ws://${location.host}/__fixture/ws`);
        const timer = setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket timeout'));
        }, 5000);
        socket.onopen = () => socket.send('header-upgrade');
        socket.onmessage = (event) => {
          clearTimeout(timer);
          socket.close();
          resolve(String(event.data));
        };
        socket.onerror = () => {
          clearTimeout(timer);
          socket.close();
          reject(new Error('WebSocket failed'));
        };
      }),
  );
  expect(echoed).toBe('header-upgrade');
  const gatewayOpened = await page.evaluate(
    () =>
      new Promise<boolean>((resolve, reject) => {
        const socket = new WebSocket(`ws://${location.host}/ws/submission`);
        const timer = setTimeout(() => {
          socket.close();
          reject(new Error('Gateway WebSocket timeout'));
        }, 5000);
        socket.onopen = () => {
          clearTimeout(timer);
          socket.close();
          resolve(true);
        };
        socket.onerror = () => {
          clearTimeout(timer);
          socket.close();
          reject(new Error('Gateway WebSocket failed'));
        };
      }),
  );
  expect(gatewayOpened).toBe(true);
  const workerMessage = await page.evaluate(
    () =>
      new Promise<string>((resolve, reject) => {
        const url = URL.createObjectURL(
          new Blob(['postMessage("worker-ready")'], { type: 'text/javascript' }),
        );
        const worker = new Worker(url);
        const timer = setTimeout(() => {
          worker.terminate();
          URL.revokeObjectURL(url);
          reject(new Error('Worker timeout'));
        }, 5000);
        worker.onmessage = (event) => {
          clearTimeout(timer);
          worker.terminate();
          URL.revokeObjectURL(url);
          resolve(String(event.data));
        };
        worker.onerror = () => {
          clearTimeout(timer);
          worker.terminate();
          URL.revokeObjectURL(url);
          reject(new Error('Worker failed'));
        };
      }),
  );
  expect(workerMessage).toBe('worker-ready');
  const reports = (await (
    await request.get(reportControlUrl, { timeout: 5000 })
  ).json()) as Report[];
  expect(reports).toEqual([]);
});

test('CSP blocks injected inline scripts and captures a redacted violation report', async ({
  page,
  request,
}) => {
  await installApi(page);
  await page.goto('/v2/login');
  await page.evaluate(() => {
    const injected = document.createElement('script');
    injected.textContent = 'window.__headerInjection = "secret-password"';
    document.body.appendChild(injected);
  });
  expect(
    await page.evaluate(
      () => (window as unknown as { __headerInjection?: string }).__headerInjection,
    ),
  ).toBeUndefined();
  await expect
    .poll(async () => {
      const reports = (await (
        await request.get(reportControlUrl, { timeout: 5000 })
      ).json()) as Report[];
      return reports.some(
        (report) => report.directive.startsWith('script-src') && report.blockedOrigin === 'inline',
      );
    })
    .toBe(true);
  const raw = await (await request.get(reportControlUrl, { timeout: 5000 })).text();
  expect(raw).not.toContain('secret-password');
  expect(raw).not.toContain('script-sample');
});

test('an unrelated origin cannot embed the application', async ({ page, request }) => {
  await installApi(page);
  await page.goto('http://127.0.0.1:4174/__fixture/embed');
  await expect(page.locator('iframe')).toBeVisible();
  const embeddedContent = await page.locator('iframe').evaluate((iframe: HTMLIFrameElement) => {
    try {
      return iframe.contentDocument?.getElementById('root')?.textContent ?? null;
    } catch {
      return null;
    }
  });
  expect(embeddedContent).toBeNull();
  for (const frame of page.frames().filter((frame) => frame.url().includes('/v2/login'))) {
    expect(
      await frame.evaluate(() => document.getElementById('root')?.childElementCount ?? 0),
    ).toBe(0);
  }
  const reports = (await (
    await request.get(reportControlUrl, { timeout: 5000 })
  ).json()) as Report[];
  expect(reports.every((report) => report.directive === 'frame-ancestors')).toBe(true);
});
