import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    let data: unknown;
    let status = 200;
    let code = 0;
    switch (pathname) {
      case '/user/getProfile':
        status = 401;
        code = 401;
        break;
      case '/site/getCopyright':
        data = 'SDUOJ';
        break;
      case '/submit/queryACProblem':
        data = [];
        break;
      case '/user/login':
        data = { username: 'test-user', roles: ['user'], features: {} };
        break;
      case '/problem/list': {
        const pageNow = Number(url.searchParams.get('pageNow') || 1);
        data = {
          rows: [
            {
              problemCode: `SDUOJ-${pageNow}`,
              problemTitle: `Example problem ${pageNow}`,
              source: 'Regression fixture',
              acceptNum: 0,
              isPublic: 1,
            },
          ],
          totalNum: 40,
          totalPage: 2,
        };
        break;
      }
      case '/submit/list':
        data = { rows: [], totalNum: 0, totalPage: 0 };
        break;
      default:
        throw new Error(`Missing API fixture: ${route.request().method()} ${pathname}`);
    }
    await route.fulfill({
      status,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code, data, message: code ? 'Unauthenticated' : '', timestamp: Date.now() },
    });
  });
});

test('login validation and successful login preserve the return route', async ({
  page,
  isMobile,
}) => {
  test.fail(
    isMobile,
    'Tracked mobile layout gap: fixed minimum width prevents touch access. See docs/FRONTEND_REVIEW.md.',
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/v2/login?to=/v2/problem');
  await page.getByRole('tab', { name: /Account|Password/i }).click();
  const login = page.getByRole('button', { name: /^Login$/i });
  await login.click();
  await expect(page.locator('.ant-form-item-explain-error').first()).toBeVisible();
  await page.locator('input[name="username"], input#username').fill('test-user');
  await page.locator('input[type="password"]').fill('test-password');
  await login.click();
  await expect(page).toHaveURL(/\/v2\/problem$/);
  await expect(page.getByText('Example problem 1', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('problem pagination remains usable after the React upgrade', async ({ page, isMobile }) => {
  test.fail(
    isMobile,
    'Tracked mobile layout gap: fixed minimum width prevents touch access. See docs/FRONTEND_REVIEW.md.',
  );
  await page.goto('/v2/problem');
  await expect(page.getByText('Example problem 1', { exact: true })).toBeVisible();
  await page.locator('.ant-pagination-item-2').click();
  await expect(page.getByText('Example problem 2', { exact: true })).toBeVisible();
});

test('submission page renders the empty state without a runtime exception', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/v2/submission');
  await expect(page.locator('.ant-empty')).toBeVisible();
  expect(errors).toEqual([]);
});

test('login visual baseline and image assets', async ({ page, browserName }, testInfo) => {
  await page.goto('/v2/login');
  await expect(page.getByRole('tab', { name: /CAS|Identity/i })).toBeVisible();
  const logo = page.getByAltText('SDUOJ-logo');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
  await page.screenshot({ path: testInfo.outputPath('login.png'), fullPage: true });
  if (browserName === 'chromium' && process.env.VISUAL_REGRESSION === '1') {
    await expect(page).toHaveScreenshot('login.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.001,
    });
  }
});
