import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.use({ trace: 'off' });

test.beforeEach(async ({ page, baseURL }) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  ) as { username: string };
  expect(user.username).toMatch(/^ai_dev_/);
  await page.addInitScript(() => localStorage.setItem('language', 'zh'));
});

test.afterEach(async ({ page }, testInfo) => {
  let logout = await page.request.get('/api/user/logout');
  // 登出接口限流时清理会 429；等一秒再试一次，不掩盖业务断言失败
  if (logout.status() === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logout = await page.request.get('/api/user/logout');
  }
  const body = await logout.json();
  await testInfo.attach('logout-cleanup', {
    contentType: 'application/json',
    body: JSON.stringify({ status: logout.status(), code: body.code }),
  });
  expect(logout.ok(), `Logout cleanup: HTTP ${logout.status()} / code ${body.code}`).toBe(true);
  expect(body.code).toBe(0);
});

test('all AI workspace pages use real dev authorization and fit desktop/mobile', async ({
  page,
}) => {
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  );
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().includes('/api/ps/auto-task/ai') && response.status() >= 400)
      failed.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect((await login.json()).code).toBe(0);
  for (const [url, heading] of [
    ['/v2/ai-workbench', '任务与创作'],
    ['/v2/ai-admin', '账户与管理'],
    ['/v2/ai-course', '课程知识库'],
    ['/v2/ai-grading', '主观题批阅'],
    ['/v2/ai-exams', '考试与考务'],
    ['/v2/ai-plagiarism', '代码查重'],
    ['/v2/ai-interviews', '实验验收'],
  ]) {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(url);
    await expect(page.getByRole('navigation', { name: 'AI 工作区' })).toBeVisible();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole('status', { name: '检查 OJ 登录' })).toHaveCount(0);
    await expect(page.locator('.ant-spin-spinning')).toHaveCount(0, { timeout: 20000 });
    if (url === '/v2/ai-admin') {
      await expect(page.getByRole('tab', { name: '模型', exact: true })).toBeVisible();
      await page.getByRole('tab', { name: '标签治理' }).click();
      await expect(page.getByLabel('规范标签名称')).toBeVisible();
      await page.getByRole('tab', { name: '使用资格' }).click();
      await expect(page.getByRole('table')).toBeVisible();
      await page.getByRole('tab', { name: '账户', exact: true }).click();
    }
    const name = url.split('/').pop();
    await page.screenshot({ path: `output/playwright/${name}-desktop.png` });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), {
        message: heading,
      })
      .toBe(true);
    await page.screenshot({ path: `output/playwright/${name}-mobile.png` });
  }
  for (const [alias, canonical, button] of [
    ['/v2/ai-bank', '/v2/manage/problemSet/problem_group', '批量录题'],
    ['/v2/ai-authoring', '/v2/manage/intelligent', '新建'],
  ]) {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(alias + '?audit=alias#entry');
    await expect(page).toHaveURL(new RegExp(canonical + '\\?audit=alias#entry$'));
    await expect(
      page.getByRole('button', { name: new RegExp(button + '$') }).first(),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
  }
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('real Gateway SSE replays durable cancellation events for an isolated task', async ({
  page,
}) => {
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  );
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect((await login.json()).code).toBe(0);
  const resource = await page.request.post('/api/ps/auto-task/ai/resources/create', {
    data: {
      kind: 'exam',
      data: { title: 'AI-DEV-SSE-' + Date.now(), mode: 'TEST', candidates: [], rooms: [] },
    },
  });
  expect(resource.ok()).toBe(true);
  const resourceEnvelope = await resource.json();
  expect(resourceEnvelope.code).toBe(0);
  const resourceId = resourceEnvelope.data.id;
  expect(typeof resourceId).toBe('string');
  try {
    const created = await page.request.post('/api/ps/auto-task/ai/jobs/create', {
      data: { resource_id: resourceId, task_type: 'exam.plan', operation_key: 'sse-' + Date.now() },
    });
    expect(created.ok()).toBe(true);
    const jobEnvelope = await created.json();
    expect(jobEnvelope.code).toBe(0);
    const taskId = jobEnvelope.data.taskId;
    const cancel = await page.request.post('/api/ps/auto-task/ai/jobs/' + taskId + '/cancel', {
      data: {},
    });
    expect(cancel.ok()).toBe(true);
    expect((await cancel.json()).code).toBe(0);
    const detail = await page.request.get('/api/ps/auto-task/ai/jobs/' + taskId);
    const detailEnvelope = await detail.json();
    expect(detailEnvelope.code).toBe(0);
    expect(detailEnvelope.data.status).toBe('cancelled');
    await page.goto('/v2/ai-workbench');
    const events = await page.evaluate(
      ({ taskId }) =>
        new Promise<string[]>((resolve, reject) => {
          const seen: string[] = [];
          const stream = new EventSource('/api/ps/auto-task/ai/jobs/' + taskId + '/events');
          const timeout = setTimeout(() => {
            stream.close();
            reject(new Error('SSE did not replay cancellation'));
          }, 15000);
          stream.onerror = () => {
            clearTimeout(timeout);
            stream.close();
            reject(new Error('SSE stream failed'));
          };
          stream.onmessage = (event) => {
            const value = JSON.parse(event.data);
            seen.push(value.tag);
            if (value.content?.event === 'cancelled') {
              clearTimeout(timeout);
              stream.close();
              resolve(seen);
            }
          };
        }),
      { taskId },
    );
    expect(events).toContain('payload');
  } finally {
    const cleanup = await page.request.post(
      '/api/ps/auto-task/ai/resources/' + resourceId + '/delete',
      { data: {} },
    );
    expect(cleanup.ok()).toBe(true);
    expect((await cleanup.json()).code).toBe(0);
  }
});

test('B-01 deleted resources do not leave unqueryable tasks in the visible list', async ({
  page,
}, testInfo) => {
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  );
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect((await login.json()).code).toBe(0);
  const resource = await page.request.post('/api/ps/auto-task/ai/resources/create', {
    data: {
      kind: 'exam',
      data: { title: 'AI-AUDIT-DELETED-' + Date.now(), mode: 'TEST', candidates: [], rooms: [] },
    },
  });
  expect(resource.ok()).toBe(true);
  const resourceEnvelope = await resource.json();
  expect(resourceEnvelope.code).toBe(0);
  const resourceId = resourceEnvelope.data.id;
  let taskId: string | undefined;
  try {
    const created = await page.request.post('/api/ps/auto-task/ai/jobs/create', {
      data: {
        resource_id: resourceId,
        task_type: 'exam.plan',
        operation_key: 'deleted-' + Date.now(),
      },
    });
    expect(created.ok()).toBe(true);
    const envelope = await created.json();
    expect(envelope.code).toBe(0);
    taskId = envelope.data.taskId;
    expect(typeof taskId).toBe('string');
  } finally {
    const cleanup = await page.request.post(
      '/api/ps/auto-task/ai/resources/' + resourceId + '/delete',
      { data: {} },
    );
    expect(cleanup.ok()).toBe(true);
    expect((await cleanup.json()).code).toBe(0);
  }
  const list = await page.request.post('/api/ps/auto-task/ai/jobs/list', {
    data: { pageNow: 1, pageSize: 100 },
  });
  expect(list.ok()).toBe(true);
  const envelope = await list.json();
  expect(envelope.code).toBe(0);
  const detail = await page.request.get('/api/ps/auto-task/ai/jobs/' + taskId);
  const detailEnvelope = await detail.json();
  await testInfo.attach('deleted-task-contract', {
    contentType: 'application/json',
    body: JSON.stringify({
      listed: envelope.data.rows.some((row: { id: string }) => row.id === taskId),
      detailHttp: detail.status(),
      detailCode: detailEnvelope.code,
      resourceDeleted: true,
    }),
  });
  expect(detail.status()).toBe(404);
  expect(envelope.data.rows.some((row: { id: string }) => row.id === taskId)).toBe(false);
});

test('existing management pages expose contextual AI workflow entries', async ({ page }) => {
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  );
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect((await login.json()).code).toBe(0);

  await page.goto('/v2/manage/problem/program');
  await expect(page.getByRole('link', { name: '客观题 / 主观题组', exact: true })).toHaveAttribute(
    'href',
    '/v2/manage/problemSet/problem_group',
  );
  await expect(page.getByRole('link', { name: '智能管理', exact: true }).last()).toHaveAttribute(
    'href',
    '/v2/manage/intelligent',
  );

  await page.goto('/v2/manage/problemSet/problem_set');
  for (const [button, heading] of [
    ['考务管理', '考试与考务'],
    ['实验验收', '实验验收'],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click();
    const drawer = page.locator('.ant-drawer-content');
    await expect(drawer.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: /^(Close|关闭)$/ }).click();
    await expect(drawer).toBeHidden();
  }

  const problemSets = await page.request.post('/api/ps/problem_set/list', {
    data: { pageNow: 1, pageSize: 20 },
  });
  const problemSetRows = (await problemSets.json()).data?.rows || [];
  expect(problemSetRows.length).toBeGreaterThan(0);
  {
    await page.goto(`/v2/problemSet/${problemSetRows[0].psid}/auto-task`);
    const taskEntry = page.getByRole('link', { name: 'AI 任务中心', exact: true }).first();
    await expect(taskEntry).toHaveAttribute('href', `/v2/workspace?psid=${problemSetRows[0].psid}`);
    await expect(page.getByRole('link', { name: 'AI 批阅', exact: true }).first()).toHaveAttribute(
      'href',
      `/v2/manage/problemSet/grading?psid=${problemSetRows[0].psid}`,
    );
  }

  await page.goto('/v2/manage/course/course');
  await expect(page.getByRole('link', { name: 'AI 课程资料', exact: true })).toHaveAttribute(
    'href',
    '/v2/courses/knowledge',
  );
  await page.getByRole('link', { name: 'AI 课程资料', exact: true }).click();
  await expect(page.getByRole('heading', { name: '课程知识库', exact: true })).toBeVisible();
});
