import { expectNoBrowserErrors } from './browser-errors';
import { test, expect, Page } from '@playwright/test';

/**
 * Validation-contract e2e extension: every business form family must reject
 * an out-of-range write before any request leaves the client.
 */

type Captured = {
  posts: Array<{ path: string; body: unknown }>;
  errors: string[];
};

const WRITE_RE = /create|update|add|delete|edit/i;

async function withMock(
  page: Page,
  handler: (p: string, method: string, body: unknown) => unknown,
) {
  const captured: Captured = { posts: [], errors: [] };
  page.on('pageerror', (e) => captured.errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : undefined;
    if (method === 'POST' && WRITE_RE.test(p)) captured.posts.push({ path: p, body });
    let data = handler(p, method, body);
    if (data === undefined) {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, message: '', timestamp: Date.now() },
    });
  });
  return captured;
}

test('announcement overlong title never posts', async ({ page }) => {
  const cap = await withMock(page, (p) => {
    if (p === '/user/getProfile') return { username: 'a', roles: ['admin'], features: {} };
    if (p === '/site/getCopyright') return 'SDUOJ';
    return undefined;
  });
  await page.goto('/v2/manage/announcement');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title').fill('t'.repeat(46));
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(cap.posts.filter((x) => x.path.includes('notice'))).toEqual([]);
  await expectNoBrowserErrors(cap.errors);
});

test('classroom overlong name never posts', async ({ page }) => {
  const cap = await withMock(page, (p) => {
    if (p === '/user/getProfile') return { username: 'a', roles: ['admin'], features: {} };
    if (p === '/site/getCopyright') return 'SDUOJ';
    return undefined;
  });
  await page.goto('/v2/manage/course/classroom');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('教室名称').fill('a'.repeat(51));
  await dialog.getByLabel('教室地点').fill('Local');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(cap.posts.filter((x) => x.path.includes('class'))).toEqual([]);
  await expectNoBrowserErrors(cap.errors);
});

test('late permission discount zero never posts', async ({ page }) => {
  const cap = await withMock(page, (p) => {
    if (p === '/user/getProfile') return { username: 'a', roles: ['admin'], features: {} };
    if (p === '/site/getCopyright') return 'SDUOJ';
    if (p === '/ps/problem_set/info_c') {
      return {
        psid: 1,
        name: 'PS',
        description: null,
        type: 0,
        global_score: 100,
        tm_start: String(Date.now() - 1000),
        tm_end: String(Date.now() + 100000),
        groupId: 1,
        manageGroupId: 2,
        tag: 'exam',
        username: 'admin',
        isAdmin: true,
        config: {
          useSameSE: 0,
          showReport: 0,
          showScoreInRunning: 0,
          showProgramScoreInRunning: 0,
          mergerSubjectiveGroup: 0,
        },
        groupInfo: [],
        latePermission: null,
      };
    }
    return undefined;
  });
  await page.goto('/v2/problemSet/1/late');
  await page.getByRole('button', { name: /Grant Late Permission/i }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('input').first().fill('late_user');
  await dialog.getByLabel(/Expire time/i).fill('2099-01-01 00:00:00');
  await dialog.getByRole('spinbutton').first().fill('0');
  await dialog.getByRole('button', { name: /^OK$/i }).click();
  await expect(dialog).toBeVisible();
  expect(cap.posts.filter((x) => x.path.includes('late/add'))).toEqual([]);
  await expectNoBrowserErrors(cap.errors);
});

test('judge template overlong title never posts', async ({ page }) => {
  const cap = await withMock(page, (p) => {
    if (p === '/user/getProfile') return { username: 'a', roles: ['admin'], features: {} };
    if (p === '/site/getCopyright') return 'SDUOJ';
    return undefined;
  });
  await page.goto('/v2/manage/template/io');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Title$/i).fill('t'.repeat(33));
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(cap.posts.filter((x) => x.path.includes('judgetemplate'))).toEqual([]);
  await expectNoBrowserErrors(cap.errors);
});
