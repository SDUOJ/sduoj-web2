import { expect, test } from '@playwright/test';

test('login preserves the target page and logout clears the session', async ({
  page,
  baseURL,
  isMobile,
}) => {
  let authenticated = false;
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    if (path === '/user/getProfile') {
      if (!authenticated) {
        await route.fulfill({
          status: 401,
          json: { code: 401, data: null, message: 'Unauthenticated', timestamp: Date.now() },
        });
      } else {
        await route.fulfill({
          json: {
            code: 0,
            data: { username: 'session-user', roles: ['user'], features: {} },
            timestamp: Date.now(),
          },
        });
      }
      return;
    }
    if (path === '/user/login') {
      authenticated = true;
      await route.fulfill({
        json: {
          code: 0,
          data: { username: 'session-user', roles: ['user'], features: {} },
          timestamp: Date.now(),
        },
      });
      return;
    }
    if (path === '/user/logout') {
      authenticated = false;
      await route.fulfill({ json: { code: 0, data: null, timestamp: Date.now() } });
      return;
    }
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0 };
    if (path === '/site/getCopyright') data = 'SDUOJ';
    if (path === '/submit/queryACProblem') data = [];
    if (path === '/problem/list') {
      data = {
        rows: [
          {
            problemCode: 'SDUOJ-1000',
            problemTitle: 'Session fixture',
            source: 'Regression fixture',
            acceptNum: 1,
            isPublic: 1,
          },
        ],
        totalNum: 1,
        totalPage: 1,
      };
    }
    if (path === '/ps/problem_set/upcoming') data = { running: [], upcoming: [] };
    await route.fulfill({ json: { code: 0, data, timestamp: Date.now() } });
  });

  const target = '/v2/problem';
  await page.goto('/v2/login?to=' + encodeURIComponent(target));
  await page.getByRole('tab', { name: /Account|Password/i }).click();
  await page.locator('input#username').fill('session-user');
  await page.locator('input#password').fill('test-password');
  await page.getByRole('button', { name: /^Login$/i }).click();
  await expect(page).toHaveURL(baseURL + target);
  await expect(page.getByText('Session fixture', { exact: true })).toBeVisible();

  const account = page.getByRole('button', { name: /session-user/i });
  if (isMobile) await account.click();
  else await account.hover();
  await expect(page.getByRole('menuitem', { name: /Logout/i })).toBeVisible();
  await page.getByRole('menuitem', { name: /Logout/i }).click();
  await expect(page).toHaveURL(/\/v2\/home$/);
  expect(authenticated).toBe(false);
});
