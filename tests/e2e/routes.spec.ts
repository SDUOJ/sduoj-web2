import { expectNoBrowserErrors } from './browser-errors';
import { test, expect } from '@playwright/test';

test('management and exam trees use the same unknown-route fallback without mounting data APIs', async ({
  page,
}) => {
  const dataRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (pathname === '/user/getProfile') {
      await route.fulfill({
        json: { code: 0, data: { username: 'route-fixture', roles: ['superadmin'], features: {} } },
      });
    } else if (pathname === '/site/getCopyright') {
      await route.fulfill({ json: { code: 0, data: 'SDUOJ' } });
    } else {
      dataRequests.push(pathname);
      await route.fulfill({ json: { code: 0, data: [] } });
    }
  });
  for (const route of [
    '/v2/manage/not-a-route',
    '/v2/exam/not-a-route',
    // Anti-cheating management was retired; its routes must stay on the 404 fallback.
    '/v2/manage/anti-cheating/hub',
    '/v2/manage/anti-cheating/task',
    '/v2/manage/anti-cheating/core',
  ]) {
    await page.goto(route);
    await expect(page.getByText('404', { exact: true })).toBeVisible();
  }
  expect(dataRequests).toEqual([]);
  await expectNoBrowserErrors(errors);
});
