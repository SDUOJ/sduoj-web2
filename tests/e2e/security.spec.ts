import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path === '/user/getProfile') {
      await route.fulfill({
        status: 401,
        json: { code: 401, data: null, message: 'Unauthenticated', timestamp: Date.now() },
      });
      return;
    }

    let data: unknown = { rows: [], totalNum: 0, totalPage: 0 };
    if (path === '/site/getCopyright') {
      data =
        '<p onclick="window.__copyrightXss = true">SDUOJ</p>' +
        '<img src="javascript:window.__copyrightXss = true" onerror="window.__copyrightXss = true">' +
        '<script>window.__copyrightXss = true</script>';
    } else if (path === '/ps/problem_set/upcoming') {
      data = { running: [], upcoming: [] };
    }
    await route.fulfill({ json: { code: 0, data, message: '', timestamp: Date.now() } });
  });
});

test('copyright HTML is rendered as inert markup', async ({ page }) => {
  await page.goto('/v2/home');
  const footer = page.locator('footer');
  await expect(footer.getByText('SDUOJ', { exact: true })).toBeVisible();
  expect(await footer.locator('script').count()).toBe(0);
  expect(await footer.locator('[onclick], [onerror]').count()).toBe(0);
  expect(await page.evaluate(() => (window as any).__copyrightXss)).toBeUndefined();
});
