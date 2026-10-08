import { test, expect, APIRequestContext, Page, TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

type Envelope<T> = { code: number; data: T; message?: string };
type User = { username: string; password: string };

const fixtureRoot = path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration');

test.use({ trace: 'off' });

function readUser(): User {
  const user = JSON.parse(
    fs.readFileSync(path.join(fixtureRoot, 'test-user.json'), 'utf8'),
  ) as User;
  expect(user.username).toMatch(/^ai_dev_/);
  return user;
}

async function login(request: APIRequestContext, user: User) {
  const response = await request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect(response.ok()).toBe(true);
  const envelope = (await response.json()) as Envelope<unknown>;
  expect(envelope.code, envelope.message).toBe(0);
}

async function call<T>(request: APIRequestContext, route: string, data?: unknown) {
  const response =
    data === undefined
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data });
  expect(response.ok(), `${route}: HTTP ${response.status()}`).toBe(true);
  const envelope = (await response.json()) as Envelope<T>;
  expect(envelope.code, `${route}: ${envelope.message ?? ''}`).toBe(0);
  return envelope.data;
}

async function attachLocalOnlyGuards(page: Page, testInfo: TestInfo) {
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  const networkFailures: string[] = [];
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      response.status() >= 400 &&
      !(response.status() === 401 && pathname === '/api/user/getProfile')
    ) {
      networkFailures.push(`${response.status()} ${pathname}`);
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      externalRequests.push(url.origin);
      await route.abort();
      return;
    }
    await route.continue();
  });
  return async () => {
    const budgets = [
      {
        name: 'dev-build-summary',
        pattern: /^warning: \[webpack-dev-server\] Warnings while compiling\.$/,
        max: 6,
      },
      {
        name: 'dev-asset-size',
        pattern:
          /^warning: (\[webpack-dev-server\] WARNING\n)?asset size limit: The following asset\(s\) exceed the recommended size limit/,
        max: 12,
      },
      {
        name: 'dev-entrypoint-size',
        pattern:
          /^warning: (\[webpack-dev-server\] WARNING\n)?entrypoint size limit: The following entrypoint\(s\) combined asset size exceeds the recommended limit/,
        max: 12,
      },
      {
        name: 'legacy-static-logout-message',
        pattern:
          /^error: Warning: \[antd: message\] Static function can not consume context like dynamic theme\. Please use 'App' component instead\.$/,
        max: 1,
      },
      {
        name: 'expected-auth-expiry',
        pattern:
          /^error: Failed to load resource: the server responded with a status of 401 \(Unauthorized\)$/,
        max: 1,
      },
    ];
    const allowed = budgets.map((budget) => ({
      name: budget.name,
      count: consoleMessages.filter((message) => budget.pattern.test(message)).length,
      max: budget.max,
    }));
    const unexpected = consoleMessages.filter(
      (message) => !budgets.some((budget) => budget.pattern.test(message)),
    );
    await testInfo.attach('error-budget', {
      contentType: 'application/json',
      body: JSON.stringify({ allowed, unexpected, pageErrors, externalRequests, networkFailures }),
    });
    expect(externalRequests).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(networkFailures).toEqual([]);
    expect(unexpected).toEqual([]);
    for (const budget of allowed) expect(budget.count, budget.name).toBeLessThanOrEqual(budget.max);
  };
}

async function openPage(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator('#webpack-dev-server-client-overlay')).toHaveCount(0);
}

test('desktop/mobile real regression covers management, contest, problem set, upload, and logout', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(10000);
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const assertClean = await attachLocalOnlyGuards(page, testInfo);
  const user = readUser();
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await login(page.request, user);
  const openapi = await page.request.get('/api/ps/openapi.json');
  expect(openapi.ok()).toBe(true);
  const spec = (await openapi.json()) as {
    info: { title: string; version: string };
    paths: object;
  };
  testInfo.annotations.push({
    type: 'boundary',
    description:
      'Java standalone exam is retired. AutoLab exams and timed problem sets remain separate active contracts.',
  });
  await testInfo.attach('local-service-manifest', {
    contentType: 'application/json',
    body: JSON.stringify({
      front: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      frontPatchHash: createHash('sha256')
        .update(execFileSync('git', ['diff', 'HEAD', '--', 'src', 'package.json']))
        .digest('hex'),
      regressionSourceHash: createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),
      javaCheckout: execFileSync('git', ['-C', '../sduoj-server-private', 'rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      autolabCheckout: execFileSync('git', ['-C', '../sduoj-autolab', 'rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      autolab: {
        ...spec.info,
        pathsHash: createHash('sha256').update(JSON.stringify(spec.paths)).digest('hex'),
      },
      containers: execFileSync('docker', ['ps', '--format', '{{.Names}} {{.Image}} {{.ID}}'], {
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter((row) => row.startsWith('sduoj-dev-')),
      javaImages: execFileSync(
        'docker',
        [
          'inspect',
          '--format',
          '{{.Name}} {{.Image}} {{.State.Running}}',
          'sduoj-dev-gateway-1',
          'sduoj-dev-filesys-service-1',
          'sduoj-dev-contest-service-1',
        ],
        { encoding: 'utf8', timeout: 10000 },
      )
        .trim()
        .split('\n'),
      standaloneExam: {
        lifecycle: 'deprecated-by-owner-2026-10-05',
      },
      timestamp: new Date().toISOString(),
      baseURL,
      fixturePolicy:
        'existing FE-DEV owner records only; no answers or templates saved; upload content already exists',
    }),
  });

  const contests = await call<{ rows: Array<{ contestId: string; contestTitle: string }> }>(
    page.request,
    '/manage/contest/page?pageNow=1&pageSize=1',
  );
  expect(contests.rows).toHaveLength(1);
  await openPage(page, `/v2/contest/${contests.rows[0].contestId}/overview`);
  await expect(page.getByText(contests.rows[0].contestTitle, { exact: true })).toBeVisible();
  await expect(page.locator('.overview-table .ant-table-row').first()).toBeVisible();
  await testInfo.attach('contest-overview', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  const sets = await call<{ rows: Array<{ psid: number; name: string; username: string }> }>(
    page.request,
    '/ps/problem_set/list',
    { pageNow: 1, pageSize: 30 },
  );
  const fixture = sets.rows.find(
    (row) =>
      row.username === user.username &&
      row.name.startsWith('FE-DEV-') &&
      row.name.endsWith('-exam'),
  );
  expect(fixture).toBeTruthy();
  await openPage(page, `/v2/problemSet/${fixture!.psid}/overview`);
  await expect(page.getByText(fixture!.name, { exact: true }).first()).toBeVisible();
  await expect(page.locator('.problemSet-overview-table .ant-table-row').first()).toBeVisible();
  await testInfo.attach('timed-problem-set-overview', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await openPage(page, `/v2/problemSet/${fixture!.psid}/problem/0/0`);
  await expect(page.locator('.Choice-title')).toBeVisible();
  await expect(page.locator('.Options-init').first()).toBeVisible();
  await expect(page.locator('.Options-content').first()).toHaveText(/\S/);
  await testInfo.attach('timed-problem-set-question', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  const practice = sets.rows.find(
    (row) =>
      row.username === user.username && row.name === fixture!.name.replace(/-exam$/, '-practice'),
  );
  expect(practice).toBeTruthy();
  await openPage(page, `/v2/problemSet/${practice!.psid}/overview`);
  await expect(page.getByText(practice!.name, { exact: true }).first()).toBeVisible();
  await expect(page.locator('.problemSet-overview-table .ant-table-row').first()).toBeVisible();

  await openPage(page, '/v2/manage/template/advanced');
  await page.getByRole('button', { name: /Create$/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  const template = await call<{ rows: Array<{ zipFileId: string }> }>(
    page.request,
    '/manage/judgetemplate/page?pageNow=1&pageSize=20&type=2',
  );
  const existingZip = template.rows.find((row) => row.zipFileId);
  expect(existingZip?.zipFileId).toBeTruthy();
  let zipResponse = await page.request.get('/api/filesys/download', {
    params: { fileId: existingZip!.zipFileId, filename: 'fixture.zip' },
  });
  for (let retry = 0; retry < 2 && zipResponse.status() === 429; retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    zipResponse = await page.request.get('/api/filesys/download', {
      params: { fileId: existingZip!.zipFileId, filename: 'fixture.zip' },
    });
  }
  expect(zipResponse.ok()).toBe(true);
  const zip = await zipResponse.body();
  expect(zip.subarray(0, 4).toString('hex')).toBe('504b0304');
  const md5 = createHash('md5').update(zip).digest('hex');
  const cached = await call<{ id: string }>(page.request, `/filesys/queryByMd5?md5=${md5}`);
  expect(cached.id).toBe(existingZip!.zipFileId);
  const upload = await page.request.post('/api/filesys/upload', {
    multipart: { file: { name: 'fixture.zip', mimeType: 'application/zip', buffer: zip } },
  });
  expect(upload.ok()).toBe(true);
  const uploaded = (await upload.json()) as Envelope<{ id: string }>;
  expect(uploaded.code).toBe(0);
  expect(uploaded.data.id).toBe(cached.id);
  const cacheResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/filesys/queryByMd5',
  );
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'fixture.zip',
    mimeType: 'application/zip',
    buffer: zip,
  });
  expect(((await (await cacheResponse).json()) as Envelope<{ id: string }>).data.id).toBe(
    cached.id,
  );
  await expect(dialog.getByText('Existing file:', { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(dialog.getByText(`${cached.id}.zip`, { exact: true })).toBeVisible();
  await dialog.getByText('Existing file:', { exact: true }).scrollIntoViewIfNeeded();
  await testInfo.attach('deduplicated-upload', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(await call(page.request, `/filesys/queryByMd5?md5=${md5}`)).toEqual(cached);
  const templatesAfter = await call<{ rows: Array<{ zipFileId: string }> }>(
    page.request,
    '/manage/judgetemplate/page?pageNow=1&pageSize=20&type=2',
  );
  expect(templatesAfter).toEqual(template);

  await page.getByRole('button', { name: new RegExp(user.username) }).click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/v2\/home$/);
  await expect(page.getByRole('button', { name: /Login|Register/i })).toBeVisible();
  await testInfo.attach('logged-out', { body: await page.screenshot(), contentType: 'image/png' });
  await openPage(page, '/v2/manage/template/advanced');
  await expect(page).toHaveURL(/\/v2\/login\?to=/);
  expect(new URL(page.url()).searchParams.get('to')).toBe('/v2/manage/template/advanced');
  await assertClean();
});
