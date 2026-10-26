import { expectBrowserErrorBudget } from '../helpers/browserErrorBudget';
import { test, expect, Page } from '@playwright/test';

const DAY = 24 * 3600_000;
const now = Date.now();

function publicInfo(overrides: Record<string, unknown> = {}) {
  return {
    psid: 1,
    name: 'Public Practice Set',
    description: '# Rules\nFinish before the deadline.',
    tm_start: String(now - 3600_000),
    tm_end: String(now + 3600_000),
    finish: 0,
    ...overrides,
  };
}

async function openPublic(page: Page, info: Record<string, unknown> | null, status = 200) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    let data: unknown = null;
    let code = 0;
    if (p === '/user/getProfile') {
      data = { username: 'student_a', roles: ['user'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/ps/problem_set/public') {
      if (status >= 400) {
        await route.fulfill({
          status,
          headers: {
            'access-control-allow-origin': 'http://127.0.0.1:4173',
            'access-control-allow-credentials': 'true',
          },
          json: { code: 404, data: null, message: 'not found', timestamp: Date.now() },
        });
        return;
      }
      data = info;
    } else {
      data = { rows: [], totalNum: 0 };
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code, data, message: '', timestamp: Date.now() },
    });
  });
  await page.goto('/v2/problemSetPublic/1');
  return { errors };
}

test('public problem set running window offers start answering', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openPublic(page, publicInfo());
  await expect(page.getByText('Public Practice Set')).toBeVisible();
  await expect(page.getByText(/Finish before the deadline/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Answering/i })).toBeEnabled();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('public problem set wait window keeps start disabled and shows countdown', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openPublic(
    page,
    publicInfo({ tm_start: String(now + DAY), tm_end: String(now + 2 * DAY) }),
  );
  await expect(page.getByText('Public Practice Set')).toBeVisible();
  await expect(page.getByText(/Countdown/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Answering/i })).toBeDisabled();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('public problem set ended window disables start', async ({ page, browserName }, testInfo) => {
  const { errors } = await openPublic(
    page,
    publicInfo({ tm_start: String(now - 2 * DAY), tm_end: String(now - DAY) }),
  );
  await expect(page.getByRole('button', { name: /Ended|Start Answering/i })).toBeDisabled();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('public problem set finished attempt is locked', async ({ page, browserName }, testInfo) => {
  const { errors } = await openPublic(page, publicInfo({ finish: 1 }));
  await expect(page.getByRole('button', { name: /Submitted/i })).toBeDisabled();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('public problem set missing info fails gracefully', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openPublic(page, null, 404);
  // page should not crash; start control stays disabled with empty label
  const start = page.getByRole('button', { name: /^$|Start Answering|Submitted|Ended/i });
  await expect(start).toBeDisabled();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});
