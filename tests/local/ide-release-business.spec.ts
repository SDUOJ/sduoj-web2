import { test, expect, Page, APIResponse, Response } from '@playwright/test';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';

type ContextFixture = {
  kind: 'contest' | 'problemSet';
  idePath: string;
  problemCode: string;
  context: {
    type: number;
    bizId: string;
    problemCode?: string;
    groupIndex?: number;
    problemIndex?: number;
  };
};
type Fixture = {
  schemaVersion: 1;
  localOnly: true;
  expectedOrigin: string;
  problemCode: string;
  template: { language: 'c' | 'cpp' | 'java' | 'python'; id: string; title: string };
  source: string;
  cancelSource: string;
  customCase: { input: string; expectedOutput: string };
  formal: { expectedJudgeResult: number; expectedJudgeScore: number };
  contexts?: ContextFixture[];
};
const fixturePath = process.env.IDE_BUSINESS_FIXTURE_JSON;
if (!fixturePath) throw new Error('IDE_BUSINESS_FIXTURE_JSON must name a real local fixture file');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as Fixture;
if (
  fixture.schemaVersion !== 1 ||
  fixture.localOnly !== true ||
  !fixture.expectedOrigin ||
  !fixture.problemCode ||
  !fixture.template?.id ||
  !fixture.template?.title ||
  !['c', 'cpp', 'java', 'python'].includes(fixture.template.language) ||
  !fixture.source?.trim() ||
  !fixture.cancelSource?.trim() ||
  typeof fixture.customCase?.input !== 'string' ||
  typeof fixture.customCase?.expectedOutput !== 'string' ||
  !Number.isFinite(fixture.formal?.expectedJudgeResult) ||
  !Number.isFinite(fixture.formal?.expectedJudgeScore)
)
  throw new Error('Business fixture is incomplete; no test is skipped for missing fixture data');

type RunDetail = {
  submissionId: string;
  judgeResult: number;
  run?: { cases: Array<{ stdout?: string; expectedOutput?: string; input: string }> };
};
const owned = new WeakMap<
  Page,
  { runs: string[]; sessions: string[]; errors: string[]; network: object[] }
>();
const terminal = (result: number) => result === -1 || result === 99 || (result >= 1 && result <= 9);
const pathIs = (response: Response, path: string, method: string) =>
  new URL(response.url()).pathname === path && response.request().method() === method;
const marker = () => `ide-business-${randomBytes(8).toString('hex')}`;
const marked = (source: string, text: string) =>
  `${source}\n${fixture.template.language === 'python' ? '#' : '//'} ${text}\n`;
async function data<T>(response: APIResponse | Response): Promise<T> {
  expect(response.ok(), `HTTP status ${response.status()}`).toBeTruthy();
  const envelope = await response.json();
  expect(envelope.code).toBe(0);
  expect(envelope.data).not.toBeNull();
  expect(envelope.data).not.toBeUndefined();
  return envelope.data as T;
}
async function replaceCode(page: Page, code: string) {
  const editor = page.locator('.ide-editor').getByRole('code');
  await editor.click();
  const mod = await page.evaluate(() =>
    /Macintosh|Mac OS X/.test(navigator.userAgent) ? 'Meta' : 'Control',
  );
  await page.keyboard.press(`${mod}+A`);
  await page.keyboard.insertText(code);
  await expect(editor).toContainText(code.split('\n').find((line) => line.trim())!);
}
async function open(page: Page, pathname = `/v2/problem/${fixture.problemCode}/ide`) {
  await page.goto(pathname);
  await page.getByLabel('评测语言').first().click();
  const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  const title = fixture.template.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const option = popup.getByTitle(new RegExp(`^${title}\\s*$`));
  if (!(await option.count()))
    await popup.locator('.rc-virtual-list-holder').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  await option.click();
  await expect(page.locator('.ide-language-bar .ant-select-selection-item').first()).toHaveText(
    fixture.template.title,
  );
  await expect(page.locator('.ide-editor').getByRole('code')).toBeVisible();
  await page.getByRole('button', { name: '选择运行或调试', exact: true }).click();
  await page.getByRole('menuitem', { name: '运行', exact: true }).click();
}
async function inputCase(page: Page) {
  const tab = page.getByRole('tab', { name: '自定义测试用例', exact: true });
  if ((await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  const panel = page.locator('.ide-console-tabs .ant-tabs-tabpane-active');
  const input = panel.getByRole('textbox', { name: '用例 1 输入', exact: true });
  const heading = panel.locator('.ant-collapse-header').filter({ hasText: '自定义测试用例' });
  if ((await heading.getAttribute('aria-expanded')) === 'false') await heading.click();
  // Each test owns a fresh browser context; retain exactly one case, even if samples were loaded.
  const remove = panel.getByRole('button', { name: '删除', exact: true });
  while ((await remove.count()) > 1) await remove.last().click();
  if (!(await input.count()))
    await panel.getByRole('button', { name: '+ 添加用例', exact: true }).click();
  await input.fill(fixture.customCase.input);
  await panel.getByRole('checkbox', { name: '对比期望输出（可为空字符串）', exact: true }).check();
  await panel
    .getByRole('textbox', { name: '用例 1 期望输出', exact: true })
    .fill(fixture.customCase.expectedOutput);
}
async function createRun(page: Page) {
  const button = page.locator('.ide-actions').getByRole('button', { name: '运行', exact: true });
  await expect(button).toBeEnabled({ timeout: 45_000 });
  const reply = page.waitForResponse((response) => pathIs(response, '/api/run/cases', 'POST'));
  await button.click();
  const response = await reply;
  const id = await data<string>(response);
  expect(id).toMatch(/^[0-9a-f]{1,16}$/i);
  owned.get(page)!.runs.push(id);
  const payload = response.request().postDataJSON();
  expect(String(payload.judgeTemplateId)).toBe(fixture.template.id);
  expect(payload.cases).toEqual([fixture.customCase]);
  return { id, payload };
}
async function queryRun(page: Page, id: string) {
  return data<RunDetail>(
    await page.request.get('/api/run/query', { params: { submissionId: id } }),
  );
}
async function completedRun(page: Page, id: string) {
  let result: RunDetail | undefined;
  await expect
    .poll(
      async () => {
        result = await queryRun(page, id);
        return terminal(result.judgeResult);
      },
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    )
    .toBe(true);
  expect(result!.submissionId).toBe(id);
  return result!;
}

test.beforeEach(async ({ page, baseURL }) => {
  expect(new URL(baseURL!).origin).toBe(fixture.expectedOrigin);
  const record = {
    runs: [] as string[],
    sessions: [] as string[],
    errors: [] as string[],
    network: [] as object[],
  };
  owned.set(page, record);
  page.on('pageerror', (error) => record.errors.push(error.message));
  page.on('response', async (response) => {
    const pathname = new URL(response.url()).pathname;
    if (!pathname.startsWith('/api/')) return;
    try {
      const envelope = await response.json();
      record.network.push({
        path: pathname,
        method: response.request().method(),
        http: response.status(),
        code: envelope.code,
      });
      if (
        pathname === '/api/ps/ide/session' &&
        response.request().method() === 'POST' &&
        envelope.data?.sessionId
      )
        record.sessions.push(envelope.data.sessionId);
    } catch {
      /* Failed HTTP and non-JSON responses remain in the browser report. */
    }
  });
  await page.addInitScript(() => localStorage.setItem('language', 'zh'));
});
test.afterEach(async ({ page }, info) => {
  const record = owned.get(page)!;
  const cleanup: object[] = [];
  for (const id of record.runs) {
    try {
      const detail = await queryRun(page, id);
      if (!terminal(detail.judgeResult)) {
        const response = await page.request.post('/api/run/cancel', { data: { submissionId: id } });
        cleanup.push({ kind: 'run', http: response.status(), code: (await response.json()).code });
      }
    } catch {
      cleanup.push({ kind: 'run', failed: true });
    }
  }
  for (const id of new Set(record.sessions)) {
    await page.waitForTimeout(350);
    try {
      const response = await page.request.post(`/api/ps/ide/session/${id}/close`, { data: {} });
      cleanup.push({ kind: 'lsp', http: response.status(), code: (await response.json()).code });
    } catch {
      cleanup.push({ kind: 'lsp', failed: true });
    }
  }
  await info.attach('owned-resource-cleanup', {
    body: JSON.stringify(cleanup),
    contentType: 'application/json',
  });
  await info.attach('business-request-summary', {
    body: JSON.stringify(record.network),
    contentType: 'application/json',
  });
  expect(record.errors, 'Browser page errors').toEqual([]);
});

test('ordinary custom input produces real results and text comparison', async ({ page }) => {
  await open(page);
  await replaceCode(page, marked(fixture.source, marker()));
  await inputCase(page);
  const { id, payload } = await createRun(page);
  expect(payload.problemCode).toBe(fixture.problemCode);
  expect(payload.context).toEqual({ type: 0, problemCode: fixture.problemCode });
  const result = await completedRun(page, id);
  expect(result.run?.cases[0].stdout).toBe(fixture.customCase.expectedOutput);
  const panel = page.getByLabel('运行结果', { exact: true });
  await expect(panel).toContainText(id);
  await expect(panel).toContainText('期望与实际文本相同');
});

test('ordinary active run survives reload and cancellation reaches terminal state', async ({
  page,
}) => {
  await open(page);
  await replaceCode(page, marked(fixture.cancelSource, marker()));
  await inputCase(page);
  const { id } = await createRun(page);
  await expect(page.getByRole('button', { name: '取消运行', exact: true })).toBeEnabled();
  await page.reload();
  const cancel = page.getByRole('button', { name: '取消运行', exact: true });
  await expect(cancel).toBeEnabled({ timeout: 10_000 });
  const reply = page.waitForResponse((response) => pathIs(response, '/api/run/cancel', 'POST'));
  await cancel.click();
  const response = await reply;
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).code).toBe(0);
  expect(response.request().postDataJSON().submissionId).toBe(id);
  expect((await completedRun(page, id)).judgeResult).toBe(99);
  await expect(page.getByLabel('运行结果', { exact: true })).toContainText('已取消');
});

test('ordinary cloud save and history restore preserve exact source', async ({ page }) => {
  await open(page);
  const text = marker();
  const source = marked(fixture.source, text);
  await replaceCode(page, source);
  const save = page.locator('.ide-cloud-bar').getByRole('button', { name: '保存', exact: true });
  await expect(save).toBeEnabled({ timeout: 40_000 });
  const savedReply = page.waitForResponse((response) => pathIs(response, '/api/ide/save', 'POST'));
  await save.click();
  const savedResponse = await savedReply;
  const snapshot = await data<{ submissionId: string }>(savedResponse);
  // Monaco selects its model EOL from the emulated platform. Check inserted text,
  // then require the cloud round trip to preserve the actual editor bytes exactly.
  const editorSource: string = savedResponse.request().postDataJSON().code;
  expect(editorSource.replace(/\r\n/g, '\n')).toBe(source);
  await expect(
    page.locator('.ide-cloud-bar').getByRole('button', { name: '已保存', exact: true }),
  ).toBeVisible();
  await replaceCode(page, marked(fixture.source, marker()));
  await page.getByRole('tab', { name: '代码历史', exact: true }).click();
  const historyReply = page.waitForResponse((response) =>
    pathIs(response, '/api/ide/history', 'POST'),
  );
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  const history = await data<Array<{ submissionId: string }>>(await historyReply);
  expect(history[0].submissionId).toBe(snapshot.submissionId);
  const codeReply = page.waitForResponse(
    (response) =>
      pathIs(response, '/api/ide/code', 'GET') &&
      new URL(response.url()).searchParams.get('submissionId') === snapshot.submissionId,
  );
  await page.getByRole('button', { name: '载入代码', exact: true }).first().click();
  const restored = await data<{ code: string }>(await codeReply);
  expect(restored.code).toBe(editorSource);
  const dialog = page.getByRole('dialog', { name: '当前代码尚未保存', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: '不保存并切换', exact: true }).click();
  await expect(page.locator('.ide-editor').getByRole('code')).toContainText(text);
});

async function terminalFrame(page: Page, id: string) {
  return page.evaluate(
    (submissionId) =>
      new Promise<number[]>((resolve, reject) => {
        const url = new URL('/ws/submission', location.origin);
        url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(url);
        const timer = window.setTimeout(() => {
          socket.close();
          reject(new Error('No terminal judge WebSocket frame'));
        }, 20_000);
        socket.onopen = () => socket.send(JSON.stringify([submissionId]));
        socket.onerror = () => {
          clearTimeout(timer);
          socket.close();
          reject(new Error('Judge WebSocket failed'));
        };
        socket.onmessage = (event) => {
          try {
            let decoded = JSON.parse(event.data);
            // The real judge protocol supports Redis-wrapped live rows and cumulative row batches.
            if (typeof decoded === 'string') decoded = JSON.parse(decoded);
            const rows =
              Array.isArray(decoded) && typeof decoded[0] === 'string' ? [decoded] : decoded;
            const row = Array.isArray(rows)
              ? rows.find(
                  (value) => Array.isArray(value) && value[0] === submissionId && value[3] === -1,
                )
              : undefined;
            if (row) {
              clearTimeout(timer);
              socket.close();
              resolve(row);
            }
          } catch {
            clearTimeout(timer);
            socket.close();
            reject(new Error('Invalid judge WebSocket JSON'));
          }
        };
      }),
    id,
  );
}
test('ordinary formal submit reaches expected judge result and replayable terminal WebSocket', async ({
  page,
}, info) => {
  await open(page);
  await replaceCode(page, marked(fixture.source, marker()));
  const reply = page.waitForResponse((response) => pathIs(response, '/api/submit/create', 'POST'));
  await page.locator('.ide-actions').getByRole('button', { name: '提交', exact: true }).click();
  const id = await data<string>(await reply);
  expect(id).toMatch(/^[0-9a-f]{1,16}$/i);
  let result: { judgeResult: number; judgeScore: number } | undefined;
  await expect
    .poll(
      async () => {
        result = await data(
          await page.request.get('/api/submit/query', { params: { submissionId: id } }),
        );
        return result!.judgeResult;
      },
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    )
    .toBe(fixture.formal.expectedJudgeResult);
  expect(result!.judgeScore).toBe(fixture.formal.expectedJudgeScore);
  const first = await terminalFrame(page, id);
  const replay = await terminalFrame(page, id);
  expect(first[5]).toBe(fixture.formal.expectedJudgeResult);
  expect(replay[1]).toBe(first[1]);
  expect(replay[5]).toBe(first[5]);
  await expect(page.getByRole('dialog')).toBeVisible();
  await info.attach('formal-terminal-summary', {
    body: JSON.stringify({ id, result, first, replay }),
    contentType: 'application/json',
  });
});

test('contexts contest and problem set retain real run business context', async ({ page }) => {
  const contexts = fixture.contexts;
  if (
    !contexts ||
    contexts.length !== 2 ||
    !contexts.some((item) => item.kind === 'contest') ||
    !contexts.some((item) => item.kind === 'problemSet')
  )
    throw new Error(
      'Real contest and problemSet fixtures are required; missing context data cannot pass or skip',
    );
  for (const item of contexts) {
    expect(item.context.type).toBe(item.kind === 'contest' ? 1 : 2);
    expect(item.context.bizId).toBeTruthy();
    expect(item.idePath).toMatch(/^\/v2\/.*\/ide$/);
    expect(item.problemCode).toBeTruthy();
    await open(page, item.idePath);
    await replaceCode(page, marked(fixture.source, marker()));
    await inputCase(page);
    const { id, payload } = await createRun(page);
    expect(payload.problemCode).toBe(item.problemCode);
    expect(payload.context).toEqual(item.context);
    expect((await completedRun(page, id)).run?.cases[0].stdout).toBe(
      fixture.customCase.expectedOutput,
    );
    await expect(page.getByRole('link', { name: '返回普通模式', exact: true })).toBeVisible();
  }
});

test('production routes expose released IDE while unfinished AI routes stay hidden', async ({
  page,
}) => {
  await open(page);
  await expect(page.locator('.ide-editor').getByRole('code')).toBeVisible();
  for (const pathname of ['/v2/workspace', '/v2/manage/intelligent', '/v2/ai-authoring']) {
    await page.goto(pathname);
    await expect(page.getByText('404', { exact: true })).toBeVisible();
    await expect(page.locator('.ide-editor')).toHaveCount(0);
  }
});
