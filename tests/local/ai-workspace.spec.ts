import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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
    ['/v2/ai-bank', 'AI 题库'],
    ['/v2/ai-course', '课程知识库'],
    ['/v2/ai-grading', '主观题批阅'],
    ['/v2/ai-exams', '考试与考务'],
    ['/v2/ai-plagiarism', '代码查重'],
    ['/v2/ai-authoring', '程序题创作'],
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
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      heading,
    ).toBeTruthy();
    await page.screenshot({ path: `output/playwright/${name}-mobile.png` });
  }
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});

test('real Gateway SSE delivers durable task events and cancellation', async ({ page }) => {
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  );
  await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  const resource = await page.request.post('/api/ps/auto-task/ai/resources/create', {
    data: { kind: 'exam', data: { title: 'AI-DEV-SSE', mode: 'TEST', candidates: [], rooms: [] } },
  });
  expect(resource.ok()).toBeTruthy();
  const resourceId = (await resource.json()).data.id;
  const created = await page.request.post('/api/ps/auto-task/ai/jobs/create', {
    data: { resource_id: resourceId, task_type: 'exam.plan', operation_key: 'sse-' + Date.now() },
  });
  expect(created.ok()).toBeTruthy();
  const taskId = (await created.json()).data.taskId;
  await page.goto('/v2/ai-workbench');
  const events = page.evaluate(
    ({ taskId }) =>
      new Promise<string[]>((resolve, reject) => {
        const seen: string[] = [];
        const stream = new EventSource('/api/ps/auto-task/ai/jobs/' + taskId + '/events');
        const timeout = setTimeout(() => {
          stream.close();
          reject(new Error('SSE did not report cancellation'));
        }, 15000);
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
  const cancel = await page.request.post('/api/ps/auto-task/ai/jobs/' + taskId + '/cancel', {
    data: {},
  });
  expect(cancel.ok()).toBeTruthy();
  expect(await events).toContain('payload');
  const detail = await page.request.get('/api/ps/auto-task/ai/jobs/' + taskId);
  expect((await detail.json()).data.status).toBe('cancelled');
  await page.request.post('/api/ps/auto-task/ai/resources/' + resourceId + '/delete', { data: {} });
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
  await expect(page.getByRole('link', { name: 'AI 题库', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-bank',
  );
  await expect(page.getByRole('link', { name: 'AI 命题', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-authoring',
  );
  await page.getByText('AI 工作区', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'AI 批阅', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-grading',
  );

  await page.goto('/v2/manage/problemSet/problem_set');
  await expect(page.getByRole('link', { name: 'AI 考务', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-exams',
  );
  await expect(page.getByRole('link', { name: 'AI 实验验收', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-interviews',
  );

  const problemSets = await page.request.post('/api/ps/problem_set/list', {
    data: { pageNow: 1, pageSize: 20 },
  });
  const problemSetRows = (await problemSets.json()).data?.rows || [];
  if (problemSetRows.length) {
    await page.goto(`/v2/problemSet/${problemSetRows[0].psid}/auto-task`);
    const taskEntry = page.getByRole('link', { name: 'AI 任务中心', exact: true }).first();
    await expect(taskEntry).toHaveAttribute(
      'href',
      `/v2/ai-workbench?psid=${problemSetRows[0].psid}`,
    );
    await expect(page.getByRole('link', { name: 'AI 批阅', exact: true }).first()).toHaveAttribute(
      'href',
      `/v2/ai-grading?psid=${problemSetRows[0].psid}`,
    );

    await page.goto(`/v2/problemSet/${problemSetRows[0].psid}/review`);
    await expect(page.getByRole('link', { name: 'AI 候选批阅', exact: true })).toHaveAttribute(
      'href',
      '/v2/ai-grading',
    );
  }

  await page.goto('/v2/manage/course/course');
  await expect(page.getByRole('link', { name: 'AI 课程资料', exact: true })).toHaveAttribute(
    'href',
    '/v2/ai-course',
  );
  await page.getByRole('link', { name: 'AI 课程资料', exact: true }).click();
  await expect(page.getByRole('heading', { name: '课程知识库', exact: true })).toBeVisible();
});
