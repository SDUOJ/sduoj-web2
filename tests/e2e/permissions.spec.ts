import { expect, test } from '@playwright/test';

test('a regular user sees 403 and does not mount management requests', async ({ page }) => {
  let managementRequests = 0;
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path === '/user/getProfile') {
      await route.fulfill({
        json: {
          code: 0,
          data: { username: 'regular-user', roles: ['user'], features: {} },
          timestamp: Date.now(),
        },
      });
      return;
    }
    if (path === '/site/getCopyright') {
      await route.fulfill({ json: { code: 0, data: 'SDUOJ', timestamp: Date.now() } });
      return;
    }
    managementRequests += 1;
    await route.fulfill({ json: { code: 0, data: { rows: [] }, timestamp: Date.now() } });
  });

  await page.goto('/v2/manage/course/classroom');
  await expect(page.getByText(/403|No permission|没有权限/i)).toBeVisible();
  expect(managementRequests).toBe(0);
});
