import { test, expect, APIRequestContext, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const state = path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration');

async function call<T>(request: APIRequestContext, route: string, data?: unknown): Promise<T> {
  const response =
    data === undefined
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data });
  expect(response.ok(), `${route}: HTTP ${response.status()}`).toBe(true);
  const envelope = await response.json();
  expect(envelope.code, `${route}: ${envelope.message ?? ''}`).toBe(0);
  return envelope.data as T;
}

async function goto(page: Page, route: string) {
  await page.goto(route);
  const dismiss = page
    .frameLocator('#webpack-dev-server-client-overlay')
    .getByRole('button', { name: 'Dismiss' });
  await dismiss.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  if (await dismiss.isVisible().catch(() => false)) await dismiss.click();
}

async function login(page: Page, user: { username: string; password: string }) {
  await goto(page, '/v2/login');
  await page.getByRole('tab', { name: /Account.*Password|账号密码/i }).click();
  await page.locator('input#username').fill(user.username);
  await page.locator('input#password').fill(user.password);
  const response = page.waitForResponse(
    (res) => res.url().endsWith('/api/user/login') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: /^Login$|^登\s*录$/i }).click();
  expect((await (await response).json()).code).toBe(0);
  expect(await call<{ username: string }>(page.request, '/user/getProfile')).toMatchObject({
    username: user.username,
  });
}

test('real isolated accounts exercise management, practice/exam sets, submission and websocket replay', async ({
  page,
  baseURL,
}, testInfo) => {
  test.setTimeout(180000);
  page.setDefaultTimeout(10000);
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const admin = JSON.parse(fs.readFileSync(path.join(state, 'test-user.json'), 'utf8')) as {
    username: string;
    password: string;
  };
  expect(admin.username).toMatch(/^ai_dev_/);
  const native = JSON.parse(fs.readFileSync(path.join(state, 'report.json'), 'utf8')) as {
    groups: { objective: number };
  };
  const suffix = randomBytes(4).toString('hex');
  const student = { username: `fe_${suffix}`, password: `Fe1!${randomBytes(12).toString('hex')}` };
  const prefix = `FE-DEV-${suffix}`;
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    if (!['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await login(page, admin);
  await call(page.request, '/manage/user/addUsers', [
    { ...student, email: `${student.username}@example.invalid`, nickname: prefix },
  ]);
  await call(page.request, '/manage/group/create', {
    title: prefix,
    description: 'Local frontend regression',
    markdown: 'Local frontend regression',
    openness: 0,
  });
  const groups = await call<Array<{ groupId: number; title: string }>>(
    page.request,
    `/manage/group/listByTitle?title=${prefix}`,
  );
  const groupId = groups.find((group) => group.title === prefix)!.groupId;
  await call(page.request, '/manage/group/addUser', { groupId, usernames: [student.username] });

  await goto(page, '/v2/manage/course/classroom');
  await page.getByRole('button', { name: /Create/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('教室名称').fill('x'.repeat(51));
  await dialog.getByLabel('教室地点').fill('Local test room');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog.getByText(/50 characters/)).toBeVisible();
  await dialog.getByLabel('教室名称').fill(prefix);
  const classroomResponse = page.waitForResponse((res) =>
    res.url().endsWith('/api/ps/class/create'),
  );
  await dialog.getByRole('button', { name: /Submit/ }).click();
  expect((await (await classroomResponse).json()).code).toBe(0);
  await expect(dialog).not.toBeVisible();

  const sets: Array<{ psid: number; name: string }> = [];
  for (const type of [0, 1]) {
    const name = `${prefix}-${type === 0 ? 'practice' : 'exam'}`;
    await call(page.request, '/ps/problem_set/add', {
      name,
      type,
      tag: 'FE-DEV',
      groupId,
      manageGroupId: null,
      description: 'Local regression fixture',
      global_score: 10,
      tm_start: Date.now() - 60000,
      tm_end: Date.now() + 3600000,
      groupInfo: [
        { gid: native.groups.objective, name: 'Objective', score: 10, timeSetting: null },
      ],
      config: {
        useSameSE: 1,
        usePractice: 0,
        showReport: 0,
        showScoreInRunning: 1,
        showProgramScoreInRunning: 1,
        mergerSubjectiveGroup: 0,
      },
    });
    const listed = await call<{ rows: Array<{ psid: number; name: string }> }>(
      page.request,
      '/ps/problem_set/list',
      { pageNow: 1, pageSize: 20, searchKey: name },
    );
    sets.push(listed.rows.find((row) => row.name === name)!);
  }

  await page.context().clearCookies();
  await login(page, student);
  const forbidden = await page.request.get('/api/manage/user/list?pageNow=1&pageSize=1');
  expect(forbidden.status() === 403 || (await forbidden.json()).code !== 0).toBe(true);
  for (const set of sets) {
    expect(set).toBeDefined();
    await goto(page, `/v2/problemSet/${set.psid}/overview`);
    await expect(page.getByText(set.name, { exact: true }).first()).toBeVisible();
    expect(await call(page.request, '/ps/problem_set/info_c', { psid: set.psid })).toBeTruthy();
  }

  await page.evaluate(() => localStorage.setItem('SDUOJ-Last-Submit-JT', '6'));
  await goto(page, '/v2/problem/SDUOJ-1000');
  await page
    .getByRole('button', { name: /^Submit$/ })
    .first()
    .click();
  const codeDialog = page.getByRole('dialog');
  await codeDialog
    .locator('.cm-content[contenteditable="true"]')
    .fill('#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}');
  const submitResponse = page.waitForResponse((res) => res.url().endsWith('/api/submit/create'));
  await codeDialog.getByRole('button', { name: /^Submit$/ }).click();
  const submission = await (await submitResponse).json();
  expect(submission.code).toBe(0);
  const submissionId = String(submission.data);
  await expect
    .poll(
      async () =>
        (
          await call<{ judgeScore: number }>(
            page.request,
            `/submit/query?submissionId=${submissionId}`,
          )
        ).judgeScore,
      { timeout: 60000 },
    )
    .toBe(100);

  const frames = await page.evaluate(async (id) => {
    const hex = id;
    const read = () =>
      new Promise<string>((resolve, reject) => {
        const socket = new WebSocket(
          `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/submission`,
        );
        const timer = setTimeout(() => {
          socket.close();
          reject(new Error('WebSocket replay timeout'));
        }, 10000);
        socket.onopen = () => socket.send(JSON.stringify([hex]));
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
      });
    return [await read(), await read()];
  }, submissionId);
  for (const frame of frames) expect(JSON.parse(frame).length).toBeGreaterThan(0);
  await expect(
    page.getByRole('dialog').getByText('Accepted', { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('local-submission.png'), fullPage: true });
  await testInfo.attach('local-records', {
    body: JSON.stringify({ prefix, groupId, sets, submissionId }),
    contentType: 'application/json',
  });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
