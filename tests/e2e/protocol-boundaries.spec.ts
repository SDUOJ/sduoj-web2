import { expect, Page, test, TestInfo, WebSocketRoute } from '@playwright/test';

const problem = (markdown: string) => ({
  problemId: 1,
  problemCode: 'SECURITY-1',
  problemTitle: 'Protocol boundary fixture',
  timeLimit: 1000,
  memoryLimit: 262144,
  source: 'Playwright',
  isAccepted: 0,
  judgeTemplates: [],
  functionTemplates: [],
  problemCaseDTOList: [],
  problemDescriptionDTO: { id: 1, markdownDescription: markdown },
  problemDescriptionListDTOList: [{ id: 1, title: 'Default', voteNum: 0 }],
});

const submission = {
  submissionId: 'abc',
  username: 'protocol-user',
  problemCode: 'SECURITY-1',
  problemTitle: 'Protocol boundary fixture',
  judgeResult: 0,
  judgeScore: 0,
  checkpointNum: 1,
  publicCheckpointNum: 0,
  sumScore: 100,
  usedTime: 0,
  usedMemory: 0,
  gmtCreate: 1791072000000,
  judgeTemplateTitle: 'C++',
};

async function expectErrorBudget(errors: string[], browserName: string, testInfo: TestInfo) {
  const resizeNotification = 'ResizeObserver loop completed with undelivered notifications.';
  const allowed: string[] =
    browserName === 'webkit' ? errors.filter((error) => error === resizeNotification) : [];
  const unexpected = errors.filter((error) => !allowed.includes(error));
  await testInfo.attach('browser-error-budget', {
    contentType: 'application/json',
    body: JSON.stringify({ allowedResizeObserverNotifications: allowed.length, unexpected }),
  });
  expect(allowed.length).toBeLessThanOrEqual(2);
  expect(unexpected).toEqual([]);
}

async function installApi(page: Page, markdown = '') {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown;
    switch (pathname) {
      case '/user/getProfile':
        data = { username: 'protocol-user', roles: ['user'], features: {} };
        break;
      case '/site/getCopyright':
        data = 'SDUOJ';
        break;
      case '/submit/queryACProblem':
        data = [];
        break;
      case '/run/capabilities':
        data = { enabled: false };
        break;
      case '/problem/query':
        data = problem(markdown);
        break;
      case '/submit/list':
        data = { rows: [submission], totalNum: 1, totalPage: 1 };
        break;
      default:
        throw new Error(`Missing protocol fixture: ${pathname}`);
    }
    await route.fulfill({ json: { code: 0, data, timestamp: Date.now() } });
  });
}

test('actual Vditor renderer keeps Markdown, math, and tables while rejecting executable markup', async ({
  page,
  browserName,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installApi(
    page,
    '# Safe heading\n\n$1 + 2$\n\n```cpp\nint answer = 42;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n' +
      '<script>window.__markdownXss = true</script>\n' +
      '<img src="javascript:window.__markdownXss=true" onerror="window.__markdownXss=true">\n' +
      '<svg onload="window.__markdownXss=true"></svg>\n' +
      '[unsafe](javascript:window.__markdownXss=true)\n' +
      '<iframe srcdoc="<script>parent.__markdownXss=true</script>"></iframe>',
  );
  await page.goto('/v2/problem/SECURITY-1');
  const content = page.locator('#problem-content');
  await expect(content.getByRole('heading', { name: 'Safe heading' })).toBeVisible();
  await expect(content.locator('table')).toBeVisible();
  await expect(content.locator('.katex')).toBeVisible();
  await expect(content.locator('pre code')).toContainText('int answer = 42;');
  await expect(content.locator('script, iframe, object, embed, [onerror], [onload]')).toHaveCount(
    0,
  );
  await expect(content.locator('[href^="javascript:"], [src^="javascript:"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { __markdownXss?: boolean }).__markdownXss),
  ).toBeUndefined();
  await expectErrorBudget(errors, browserName, testInfo);
});

test('oversized Markdown gets a visible fallback and does not load renderer content', async ({
  page,
  browserName,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installApi(page, 'x'.repeat(1024 * 1024 + 1));
  await page.goto('/v2/problem/SECURITY-1');
  await expect(page.getByRole('alert')).toContainText('Unable to preview this content');
  await expect(page.locator('#problem-content')).toBeEmpty();
  await expectErrorBudget(errors, browserName, testInfo);
});

test('judging rejects unsupported frames, reconnects, and deduplicates legacy checkpoint replay', async ({
  page,
}) => {
  const errors: string[] = [];
  const sockets: WebSocketRoute[] = [];
  const subscriptions: string[] = [];
  let closed = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  await installApi(page);
  await page.routeWebSocket('**/ws/submission', (socket) => {
    sockets.push(socket);
    socket.onMessage((data) => subscriptions.push(String(data)));
    socket.onClose(() => {
      closed += 1;
    });
  });
  await page.goto('/v2/submission');
  const row = page.getByRole('row').filter({ hasText: 'abc' });
  await expect(row).toBeVisible();
  await expect.poll(() => subscriptions.length).toBe(1);
  expect(JSON.parse(subscriptions[0])).toEqual(['abc']);
  sockets[0].send(JSON.stringify({ protocol_version: 2, records: [] }));
  sockets[0].send('{broken');
  sockets[0].send(' '.repeat(1024 * 1024 + 1));
  await expect(page.locator('.ant-message-error')).toContainText('A judging update was rejected');
  const checkpoint = ['abc', 3, 0, 0, 1, 1, 10, 2, 1024];
  sockets[0].send(JSON.stringify(checkpoint));
  await expect(row.getByRole('cell', { name: '10%', exact: true })).toBeVisible();
  await sockets[0].close({ code: 1000, reason: 'fixture reconnect' });
  await expect.poll(() => subscriptions.length).toBe(2);
  sockets[1].send(JSON.stringify(JSON.stringify(checkpoint)));
  await expect(row.getByRole('cell', { name: '10%', exact: true })).toBeVisible();
  sockets[1].send(JSON.stringify([['abc', 3, null, -1, 0, 1, 100, 12, 1024]]));
  await expect(row.getByText('Accepted', { exact: true })).toBeVisible();
  await expect(row.getByRole('cell', { name: '100%', exact: true })).toBeVisible();
  await expect.poll(() => closed).toBeGreaterThan(0);
  expect(await page.evaluate(() => localStorage.getItem('submissionVersion:abc'))).toBe('3');
  expect(errors).toEqual([]);
});
