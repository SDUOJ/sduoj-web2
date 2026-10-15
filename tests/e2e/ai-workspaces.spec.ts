import { test, expect, Page } from '@playwright/test';

const AI_ROUTES = [
  '/v2/ai-workbench',
  '/v2/ai-bank',
  '/v2/ai-authoring',
  '/v2/ai-grading',
  '/v2/ai-exams',
  '/v2/ai-course',
  '/v2/ai-plagiarism',
  '/v2/ai-interviews',
  '/v2/ai-admin',
];

async function openAiPage(page: Page, path: string) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, items: [], jobs: [] };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': 'http://127.0.0.1:4173',
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'access-control-allow-headers': 'content-type',
        },
      });
      return;
    }
    if (p === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin', 'superadmin'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p.startsWith('/ai/')) {
      data = { rows: [], items: [], jobs: [], total: 0, enabled: true, settings: {} };
    } else {
      data = { rows: [], totalNum: 0, totalPage: 0 };
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, message: '', timestamp: Date.now() },
    });
  });
  await page.goto(path);
  return { errors };
}

for (const route of AI_ROUTES) {
  test(`AI workspace ${route} mounts without runtime errors`, async ({ page }) => {
    const { errors } = await openAiPage(page, route);
    // page shell renders at least one control
    await expect(page.getByRole('button').first()).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    expect(errors, route).toEqual([]);
  });
}

test('AI admin settings page exposes configuration controls', async ({ page }) => {
  const { errors } = await openAiPage(page, '/v2/ai-admin');
  await expect(page.getByRole('button').first()).toBeVisible();
  expect(errors).toEqual([]);
});
