import { test as base, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Audit = { writes: string[]; external: string[]; errors: string[] };

const test = base.extend<{ audit: Audit }>({
  audit: async ({ page, baseURL }, use, testInfo) => {
    expect(baseURL).toBeTruthy();
    expect(['127.0.0.1', 'localhost']).toContain(new URL(baseURL!).hostname);
    const user = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
        'utf8',
      ),
    ) as { username: string; password: string };
    expect(user.username).toMatch(/^ai_dev_/);
    const audit: Audit = { writes: [], external: [], errors: [] };
    page.on('pageerror', (error) => audit.errors.push(error.message));
    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
        audit.external.push(url.origin);
        return route.abort();
      }
      if (url.pathname.startsWith('/api/')) {
        const allowed = ['GET', 'HEAD', 'OPTIONS'].includes(request.method())
          ? !/\/(delete|remove|rejudge|invalidate|invalidateSubmission|apply|quit|sign-in|sign-out)(?:\/|$)/i.test(
              url.pathname,
            )
          : /\/(login|info|list|query|getInfos|page|search|submissionList|submissionInfo)$/i.test(
              url.pathname,
            );
        if (!allowed) {
          audit.writes.push(`${request.method()} ${url.pathname}`);
          return route.abort();
        }
      }
      return route.continue();
    });
    await page.addInitScript(() => localStorage.setItem('language', 'zh'));
    const response = await page.request.post('/api/user/login', {
      data: { username: user.username, password: user.password },
    });
    expect(response.ok()).toBe(true);
    expect((await response.json()).code).toBe(0);
    try {
      await use(audit);
    } finally {
      const logout = await page.request.get('/api/user/logout');
      expect(logout.ok()).toBe(true);
      expect((await logout.json()).code).toBe(0);
      await testInfo.attach('read-only-local-network', {
        contentType: 'application/json',
        body: JSON.stringify(audit),
      });
      if (audit.external.length || audit.writes.length || audit.errors.length) {
        test.fail(false, 'Unexpected network or page errors are not a known issue reproduction');
      }
      expect(audit.external).toEqual([]);
      expect(audit.writes).toEqual([]);
      expect(audit.errors).toEqual([]);
    }
  },
});

test.use({ trace: 'off' });
test.beforeEach(async ({ audit }) => {
  expect(audit.writes).toEqual([]);
});

async function checkpoints(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/v2/manage/problem/program');
  await page.getByRole('button', { name: '测试点', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  // 用行序号钉住目标行：添加样例后 plus 会变成 minus，按图标过滤会导致 locator 漂移
  const rows = dialog.locator('.ant-table-row');
  const count = await rows.count();
  let row = rows.first();
  for (let index = 0; index < count; index += 1) {
    const candidate = rows.nth(index);
    if ((await candidate.locator('[aria-label=plus]').count()) > 0) {
      row = candidate;
      break;
    }
  }
  await expect(row).toBeVisible();
  return { dialog, row, input: row.getByRole('textbox') };
}

async function submission(page: Page, result: '编译错误' | '运行时错误') {
  await page.goto('/v2/submission');
  await page.getByRole('combobox', { name: '评测结果 :' }).click();
  await page.getByRole('heading', { name: result, exact: true }).last().click();
  const loaded = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/submit/list',
  );
  await page.getByRole('button', { name: '筛 选', exact: true }).click();
  expect((await (await loaded).json()).code).toBe(0);
  const row = page.locator('.ant-table-row').filter({ hasText: result }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button').first().click();
  const dialog = page.getByRole('dialog');
  const summary = dialog.locator('.ant-steps-item').filter({ hasText: '总结' });
  await expect(summary).toBeVisible();
  await expect(dialog.getByRole('button', { name: '关 闭', exact: true })).toBeVisible();
  return { dialog, summary };
}

async function descriptionEditor(page: Page) {
  await page.goto('/v2/manage/problem/program');
  await page.getByRole('button', { name: '题目描述', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: '编辑', exact: true }).first().click();
  const dialog = page.getByRole('dialog').last();
  const editor = dialog.locator('.vditor-ir pre[contenteditable=true]');
  await expect(editor).toBeVisible();
  await expect(editor).not.toHaveText('');
  return { dialog, editor };
}

test('#29 description dialog survives a responsive breakpoint', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/v2/manage/problem/program');
  await page.getByRole('button', { name: '题目描述', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize({ width: 393, height: 851 });
  await testInfo.attach('after-resize', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 });
});

test('#51 adding a sample preserves an unsaved valid score', async ({ page }, testInfo) => {
  const { dialog, row, input } = await checkpoints(page);
  const original = await input.inputValue();
  const score = original === '37' ? '38' : '37';
  await input.fill(score);
  await row
    .locator('button')
    .filter({ has: page.locator('[aria-label=plus]') })
    .click();
  await testInfo.attach('checkpoint-score', {
    body: JSON.stringify({
      original,
      entered: score,
      actual: await input.inputValue(),
      saved: false,
    }),
    contentType: 'application/json',
  });
  try {
    await expect(input).toHaveValue(score, { timeout: 3000 });
  } finally {
    await dialog.getByRole('button', { name: /取.*消/ }).click();
  }
});

test('#51 desktop checkpoint editing retains keyboard focus', async ({ page }) => {
  const { dialog, input } = await checkpoints(page);
  await input.fill('3');
  await input.press('End');
  await input.press('7');
  await expect(input).toHaveValue('37');
  await expect(input).toBeFocused();
  await dialog.getByRole('button', { name: /取.*消/ }).click();
});

test('#51 removing a sample still preserves an unsaved score', async ({ page }, testInfo) => {
  const { dialog, row, input } = await checkpoints(page);
  const original = await input.inputValue();
  const score = original === '37' ? '38' : '37';
  await input.fill(score);
  const plus = row.locator('button').filter({ has: page.locator('[aria-label=plus]') });
  await plus.click();
  await expect(input).toHaveValue(score, { timeout: 3000 });

  await row
    .locator('button')
    .filter({ has: page.locator('[aria-label=minus]') })
    .click();
  await testInfo.attach('checkpoint-score-after-remove', {
    contentType: 'application/json',
    body: JSON.stringify({
      original,
      entered: score,
      actual: await input.inputValue(),
      saved: false,
    }),
  });
  try {
    await expect(input).toHaveValue(score, { timeout: 3000 });
  } finally {
    await dialog.getByRole('button', { name: /取.*消/ }).click();
  }
});

test('#17 problem titles expose a browser-native link', async ({ page }) => {
  await page.goto('/v2/problem');
  const row = page.locator('.ant-table-row').first();
  await expect(row).toBeVisible();
  await expect(row.locator('a[href*="/problem/"]')).toHaveCount(1);
});

test('#33 completed CE submissions allow their summary', async ({ page }, testInfo) => {
  const { summary } = await submission(page, '编译错误');
  await testInfo.attach('ce-summary-step', {
    contentType: 'application/json',
    body: JSON.stringify({ className: await summary.getAttribute('class') }),
  });
  await expect(summary).not.toHaveClass(/ant-steps-item-disabled/);
  await summary.click();
  await expect(page.getByRole('dialog').getByText('总览', { exact: true })).toBeVisible();
});

test('#33 RE summary shows its result and public error-data entry', async ({ page }) => {
  const { dialog, summary } = await submission(page, '运行时错误');
  await expect(summary).not.toHaveClass(/ant-steps-item-disabled/);
  await summary.click();
  await expect(dialog.getByText('总览', { exact: true })).toBeVisible();
  await expect(dialog.getByText('运行时错误', { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText('下载首个错误测试点', { exact: true })).toBeVisible();
});

test('#47 @known-issue administrator data-download entry opens checkpoint information', async ({
  page,
}, testInfo) => {
  const { dialog, summary } = await submission(page, '运行时错误');
  await summary.click();
  const button = dialog.getByRole('button', { name: /下载数据$/ });
  await expect(button).toBeVisible();
  await button.click();
  await testInfo.attach('download-entry', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  test.fail(true, 'GitHub #47: DownloadTestCase renders an inert button without a data picker');
  await expect(page.getByRole('dialog')).toHaveCount(2, { timeout: 3000 });
});

test('#31 invalid classroom form does not send a create request', async ({ page, audit }) => {
  await page.goto('/v2/manage/course/classroom');
  await page.getByRole('button', { name: /新建/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('教室名称').fill('x'.repeat(51));
  await dialog.getByLabel('教室地点').fill('Audit read-only validation');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /^提\s*交$/ }).click();
  await expect(dialog.locator('.ant-form-item-explain-error').first()).toBeVisible();
  expect(audit.writes).toEqual([]);
  await dialog
    .getByRole('button', { name: /Close|取.*消|关.*闭/ })
    .first()
    .click();
});

test('#32 real Vditor restores an unsaved problem-description draft after reload', async ({
  page,
}, testInfo) => {
  const { dialog, editor } = await descriptionEditor(page);
  const marker = `AUDIT-UNSAVED-${Date.now()}`;
  await editor.fill(marker);
  await editor.press('End');
  await editor.press('x');
  await dialog.getByRole('textbox').first().click();
  await expect
    .poll(
      () =>
        page.evaluate(
          (text) =>
            Object.entries(localStorage).some(
              ([key, value]) => key.startsWith('sduoj:vditor:draft:') && value.includes(text),
            ),
          marker,
        ),
      { timeout: 5000 },
    )
    .toBe(true);
  await page.reload();
  const reopened = await descriptionEditor(page);
  await testInfo.attach('draft-after-reload', {
    body: JSON.stringify({
      marker,
      restored: (await reopened.editor.innerText()).includes(marker),
      saved: false,
    }),
    contentType: 'application/json',
  });
  await expect(reopened.editor).toContainText(marker, { timeout: 3000 });
});

test('#54 real CodeMirror accepts a 512 KiB clipboard paste without submission', async ({
  page,
}, testInfo) => {
  await page.goto('/v2/problem');
  await page.locator('.ant-table-row').first().getByRole('button').first().click();
  await page
    .getByRole('button', { name: /^提\s*交$/ })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').first().click();
  await dialog.getByRole('combobox').first().press('ArrowDown');
  await dialog.getByRole('combobox').first().press('Enter');
  const editor = dialog.locator('.cm-content[contenteditable=true]');
  await expect(editor).toBeVisible();
  const metrics = await editor.evaluate(async (element) => {
    const text = '/* audit clipboard payload */\n'.repeat(20000).slice(0, 512 * 1024);
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', text);
    element.focus();
    const started = performance.now();
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    return { bytes: text.length, elapsedMs: performance.now() - started };
  });
  await testInfo.attach('paste-metrics', {
    body: JSON.stringify(metrics),
    contentType: 'application/json',
  });
  expect(metrics.bytes).toBe(512 * 1024);
  await expect(editor).toContainText('audit clipboard payload');
  expect(metrics.elapsedMs).toBeLessThan(5000);
  await dialog
    .getByRole('button', { name: /Close|取.*消|关.*闭/ })
    .first()
    .click();
});

test('#32 @known-issue unsaved Markdown changes warn before leaving the page', async ({
  page,
}, testInfo) => {
  const { editor } = await descriptionEditor(page);
  await editor.fill('AUDIT-UNSAVED-LEAVE');
  await editor.press('End');
  await editor.press('x');
  const guarded = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented || event.returnValue === false;
  });
  await testInfo.attach('unsaved-leave-guard', {
    contentType: 'application/json',
    body: JSON.stringify({ guarded, saved: false }),
  });
  test.fail(true, 'GitHub #32: dirty Markdown does not register an unload guard');
  expect(guarded).toBe(true);
});

for (const locale of ['zh', 'en']) {
  test(`retired Java exam routes show ${locale} notice without legacy API calls`, async ({
    page,
  }) => {
    await page.addInitScript((language) => localStorage.setItem('language', language), locale);
    const calls: string[] = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (/^\/api\/(manage\/)?exam(?:\/|$)/.test(pathname)) calls.push(pathname);
    });
    for (const route of [
      '/exam',
      '/exam/list',
      '/exam/wait/1',
      '/exam/running/1/1/1',
      '/exam/finish',
      '/exam/report/1',
      '/manage/exam',
      '/manage/problemSet/exam',
    ]) {
      await page.goto(`/v2${route}?audit=retired#notice`);
      await expect(
        page.getByRole('heading', {
          name: locale === 'zh' ? '旧版 Java 考试已废弃' : 'Legacy Java exams are retired',
        }),
      ).toBeVisible();
      await expect(page.locator('a[href="/v2/manage/problemSet/exams"]')).toBeVisible();
      expect(page.url()).toContain('?audit=retired#notice');
    }
    expect(calls).toEqual([]);
  });
}

test('anonymous legacy exam links show retirement and unknown exam routes still show 404', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  const examCalls: string[] = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (/^\/api\/(manage\/)?exam(?:\/|$)/.test(pathname)) examCalls.push(pathname);
  });
  await context.addInitScript(() => localStorage.setItem('language', 'en'));
  try {
    await page.goto('/v2/exam/list');
    await expect(
      page.getByRole('heading', { name: 'Legacy Java exams are retired' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/v2\/exam\/list$/);
    await page.goto('/v2/exam/not-a-route');
    await expect(page.getByText('404', { exact: true })).toBeVisible();
    expect(examCalls).toEqual([]);
  } finally {
    await context.close();
  }
});
