import { test, expect, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Fixture = {
  title: string;
  templateId: string;
  complete: string;
  label: string;
  debug: string;
  breakpoints: number[];
};
const fixtures = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../fixtures/ide-worker-live.json'), 'utf8'),
) as Record<string, Fixture>;
const sessions = new WeakMap<Page, Array<{ id: string; debug: boolean; epoch?: string }>>();
const network = new WeakMap<Page, object[]>();
const modifiers = new WeakMap<Page, string>();

async function modifier(page: Page) {
  if (!modifiers.has(page)) {
    // Monaco derives key bindings from the browser UA. Playwright's Desktop
    // Chrome preset can emulate Windows even when Node runs on a Mac.
    modifiers.set(
      page,
      await page.evaluate(() =>
        /Macintosh|Mac OS X/.test(navigator.userAgent) ? 'Meta' : 'Control',
      ),
    );
  }
  return modifiers.get(page)!;
}

test.skip(!process.env.IDE_LIVE_STORAGE, 'Explicit local real-service authentication is required');

test.afterEach(async ({ page }, info) => {
  const cleanup: object[] = [];
  for (const session of sessions.get(page) ?? []) {
    await page.waitForTimeout(350);
    const endpoint = session.debug
      ? `/api/ps/ide/debug/session/${session.id}/stop`
      : `/api/ps/ide/session/${session.id}/close`;
    try {
      const response = await page.request.post(endpoint, {
        data: session.debug ? { sessionEpoch: session.epoch } : {},
      });
      const envelope = await response.json();
      cleanup.push({
        debug: session.debug,
        http: response.status(),
        code: envelope.code,
        closed: envelope.data?.closed,
        state: envelope.data?.state,
      });
    } catch {
      cleanup.push({ debug: session.debug, failed: true });
    }
  }
  await info.attach('owned-session-cleanup', {
    body: JSON.stringify(cleanup),
    contentType: 'application/json',
  });
  await info.attach('complete-ide-network-summary', {
    body: JSON.stringify(network.get(page)),
    contentType: 'application/json',
  });
});

async function replaceCode(page: Page, code: string) {
  const editor = page.locator('.ide-editor').getByRole('code');
  await editor.click();
  const mod = await modifier(page);
  await page.keyboard.press(`${mod}+A`);
  await page.keyboard.insertText(code);
  await expect(editor).toContainText(code.split('\n')[0]);
  await page.keyboard.press(`${mod}+Home`);
}

async function lineColumn(page: Page, before: string) {
  await page.locator('.ide-editor').getByRole('code').click();
  await page.keyboard.press(`${await modifier(page)}+Home`);
  const lines = before.split('\n');
  for (let line = 1; line < lines.length; line++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Home');
  for (let col = 0; col < lines[lines.length - 1].length; col++)
    await page.keyboard.press('ArrowRight');
}

async function chooseLanguage(page: Page, title: string) {
  await page.getByLabel('评测语言').first().click();
  const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  const option = popup.getByTitle(
    new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$'),
  );
  if (!(await option.count())) {
    await popup.locator('.rc-virtual-list-holder').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
  }
  await option.click();
  await expect(page.locator('.ide-language-bar .ant-select-selection-item').first()).toHaveText(
    title,
  );
}

for (const [language, fixture] of Object.entries(fixtures)) {
  test(`real ${language} browser completion, breakpoint, step, watch and interactive IO`, async ({
    page,
    baseURL,
  }, info) => {
    expect(['127.0.0.1', 'localhost']).toContain(new URL(baseURL!).hostname);
    const failures: string[] = [];
    const requests: object[] = [];
    let debugSnapshot: {
      state?: string;
      busy?: boolean;
      stopId?: string;
      stateVersion?: number;
      reason?: string;
    } = {};
    network.set(page, requests);
    const created: Array<{ id: string; debug: boolean; epoch?: string }> = [];
    sessions.set(page, created);
    page.on('response', async (response) => {
      if (!response.url().includes('/ps/ide/')) return;
      try {
        const value = await response.json();
        const snapshot = value.data?.snapshot;
        if (snapshot) debugSnapshot = snapshot;
        requests.push(
          ...(snapshot
            ? [
                {
                  path: new URL(response.url()).pathname,
                  snapshot: {
                    state: snapshot.state,
                    busy: snapshot.busy,
                    stopId: snapshot.stopId,
                    stateVersion: snapshot.stateVersion,
                    reason: snapshot.reason,
                  },
                  events: value.data.events?.map(
                    (event: {
                      type: string;
                      data?: { operation?: string; status?: string; reason?: string };
                    }) => ({
                      type: event.type,
                      operation: event.data?.operation,
                      status: event.data?.status,
                      reason: event.data?.reason,
                    }),
                  ),
                },
              ]
            : []),
        );
        if (
          new URL(response.url()).pathname.endsWith('/session') &&
          response.request().method() === 'POST' &&
          value.data?.sessionId
        ) {
          created.push({
            id: value.data.sessionId,
            epoch: value.data.sessionEpoch,
            debug: response.url().includes('/debug/'),
          });
        }
        requests.push({
          path: new URL(response.url()).pathname,
          http: response.status(),
          code: value.code,
          status: value.data?.status,
          revision: value.data?.revision,
          itemCount: value.data?.items?.length,
          capability: response.url().endsWith('/capabilities') ? value.data : undefined,
          state: value.data?.state,
          busy: value.data?.busy,
          reason: value.data?.reason,
          operation:
            response.request().method() === 'POST'
              ? response.request().postDataJSON()?.operation
              : undefined,
          templateId:
            response.request().method() === 'POST'
              ? response.request().postDataJSON()?.judgeTemplateId
              : undefined,
          knownStateVersion: response.url().endsWith('/events')
            ? response.request().postDataJSON()?.knownStateVersion
            : undefined,
          knownBusy: response.url().endsWith('/events')
            ? response.request().postDataJSON()?.knownBusy
            : undefined,
          waitSeconds: response.url().endsWith('/events')
            ? response.request().postDataJSON()?.waitSeconds
            : undefined,
        });
      } catch {
        /* Non-JSON network failures remain in the normal test report. */
      }
    });
    // A browser/context crash does not run React unmount cleanup. Retain the
    // real created IDs so even a failed assertion closes only this test's work.
    page.on('pageerror', (error) => failures.push(error.message));
    await page.addInitScript(() => localStorage.setItem('language', 'zh'));
    await page.goto(`/v2/problem/${process.env.IDE_LIVE_PROBLEM_CODE ?? 'SDUOJ-1000'}/ide`);
    await chooseLanguage(page, fixture.title);
    await expect(page.getByRole('code').last()).toBeVisible();
    await replaceCode(page, fixture.complete.replace('|', ''));
    await lineColumn(page, fixture.complete.split('|')[0]);
    // Require the actual server result as well as Monaco's rendered candidate;
    // Python's local snippets alone must not satisfy this E2E check.
    let serverReady = false;
    for (let attempt = 0; attempt < 4 && !serverReady; attempt++) {
      const reply = page
        .waitForResponse(
          (response) =>
            response.url().includes('/completion') && response.request().method() === 'POST',
          { timeout: 4000 },
        )
        .catch(() => undefined);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Control+Space');
      const response = await reply;
      if (!response) continue; // A cold provider does not issue requests before capabilities finish.
      const value = await response.json();
      serverReady =
        response.ok() &&
        value.code === 0 &&
        value.data?.status === 'ready' &&
        value.data.items?.some(
          (item: { label?: string; insertText?: string; filterText?: string }) =>
            [item.label, item.filterText, item.insertText].some((text) =>
              text?.startsWith(fixture.label),
            ),
        );
      if (!serverReady) await page.waitForTimeout(750);
    }
    await info.attach('ide-network-summary', {
      body: JSON.stringify(requests),
      contentType: 'application/json',
    });
    await expect(page.getByRole('code').last()).toContainText(
      fixture.complete.replace('|', '').split('\n')[0],
    );
    expect(
      serverReady,
      'server completion must contain the expected current-prefix candidate',
    ).toBe(true);
    const candidate = page
      .getByRole('listbox', { name: 'Suggest', exact: true })
      .getByRole('listitem')
      .filter({ hasText: fixture.label })
      .first();
    await expect(candidate).toBeVisible();
    // Visibility does not select a candidate: Java can rank subSequence before
    // substring. Navigate the real Monaco list, then accept the chosen item.
    for (
      let move = 0;
      move < 30 && !/\bfocused\b/.test((await candidate.getAttribute('class')) ?? '');
      move++
    ) {
      await page.keyboard.press('ArrowDown');
    }
    await expect(candidate).toHaveClass(/\bfocused\b/);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Escape');
    await expect(page.locator('.ide-editor').getByRole('code')).toContainText(fixture.label);
    await page.screenshot({ path: info.outputPath(`${language}-completion.png`) });

    await replaceCode(page, fixture.debug);
    await page.getByRole('button', { name: '选择运行或调试', exact: true }).click();
    await info.attach('ide-before-debug-capabilities', {
      body: JSON.stringify(requests),
      contentType: 'application/json',
    });
    await expect(page.getByRole('menuitem', { name: '调试', exact: true })).toBeEnabled();
    await page.getByRole('menuitem', { name: '调试', exact: true }).click();
    // F9 follows the same cursor/gutter handler as user breakpoints.
    for (const line of fixture.breakpoints) {
      await lineColumn(
        page,
        fixture.debug
          .split('\n')
          .slice(0, line - 1)
          .join('\n') + '\n',
      );
      await page.keyboard.press('F9');
    }
    const startRequest = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === '/api/ps/ide/debug/session' &&
        request.method() === 'POST',
    );
    await page.getByRole('button', { name: '调试', exact: true }).click();
    const started = (await startRequest).postDataJSON();
    expect(started.judgeTemplateId).toBe(fixture.templateId);
    const canonicalLines = (source: string) =>
      source
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .join('\n');
    // Monaco uses the emulated platform's EOL and auto-indents typed text.
    // Preserve every line/token while allowing those presentation differences.
    expect(canonicalLines(started.code)).toBe(canonicalLines(fixture.debug));
    expect(started.breakpoints).toEqual(fixture.breakpoints);
    const next = page.getByRole('button', { name: '单步跳过', exact: true });
    const resume = page.getByRole('button', { name: '继续', exact: true });
    try {
      await expect(next).toBeEnabled({ timeout: 30_000 });
      const firstLine = page.locator('.ide-debug-stack button').first().locator('span').last();
      await expect(firstLine).toHaveText(/\d+/);
      if ((await firstLine.textContent()) !== String(fixture.breakpoints[0])) {
        await resume.click();
        await expect(firstLine).toHaveText(String(fixture.breakpoints[0]));
        await expect(next).toBeEnabled();
      }
      await page.getByRole('button', { name: '添加监视', exact: true }).click();
      await page.getByLabel('监视变量路径', { exact: true }).fill('value');
      await page.getByLabel('监视变量路径', { exact: true }).press('Enter');
      await expect(page.locator('.ide-debug-watch')).toContainText('41');
      const beforeStepStopId = debugSnapshot.stopId;
      await next.click();
      await expect
        .poll(
          () =>
            debugSnapshot.state === 'stopped' &&
            debugSnapshot.stopId !== beforeStepStopId &&
            !debugSnapshot.busy,
          { timeout: 15_000, message: 'step must complete at a new stopped snapshot' },
        )
        .toBe(true);
      const steppedStopId = debugSnapshot.stopId;
      await expect(next).toBeEnabled();
      await resume.click();
      await expect(page.getByRole('button', { name: '暂停', exact: true })).toBeEnabled();
      await page.getByLabel('程序标准输入', { exact: true }).fill('5');
      await page.getByLabel('程序标准输入', { exact: true }).press('Enter');
      await expect
        .poll(
          () =>
            debugSnapshot.state === 'stopped' &&
            debugSnapshot.stopId !== steppedStopId &&
            !debugSnapshot.busy,
          { timeout: 15_000, message: 'stdin must reach the second breakpoint and release busy' },
        )
        .toBe(true);
      await expect(firstLine).toHaveText(String(fixture.breakpoints[1]));
      await expect(resume).toBeEnabled({ timeout: 10_000 });
      await resume.click();
      await expect(page.getByRole('log').filter({ hasText: 'ECHO:47' })).toBeVisible({
        timeout: 20_000,
      });
      await expect(page.locator('.ide-debug-sidebar')).toContainText('已结束');
      expect(
        requests.some((row) => {
          const poll = row as {
            knownStateVersion?: number;
            knownBusy?: boolean;
            waitSeconds?: number;
          };
          return (
            poll.waitSeconds === 20 &&
            typeof poll.knownStateVersion === 'number' &&
            typeof poll.knownBusy === 'boolean'
          );
        }),
        'the served frontend must use the G2 persisted-state polling token',
      ).toBe(true);
      await page.screenshot({ path: info.outputPath(`${language}-debug-output.png`) });
    } finally {
      const stop = page.getByRole('button', { name: '停止', exact: true });
      if (await stop.isVisible().catch(() => false)) await stop.click();
    }
    expect(failures).toEqual([]);
  });
}
