import { test, expect } from '@playwright/test';

test('classroom form blocks storage overflow and submits a valid boundary value', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'The existing administrative layout requires a desktop viewport.');
  let submitted: unknown;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown;
    switch (path) {
      case '/user/getProfile':
        data = { username: 'test_admin', roles: ['admin'], features: {} };
        break;
      case '/site/getCopyright':
        data = 'SDUOJ';
        break;
      case '/ps/class/list':
        data = { rows: [], totalNum: 0 };
        break;
      case '/ps/class/create':
        submitted = route.request().postDataJSON();
        data = { c_id: 1 };
        break;
      default:
        throw new Error(`Missing fixture: ${path}`);
    }
    await route.fulfill({ json: { code: 0, data, timestamp: Date.now() } });
  });
  await page.goto('/v2/manage/course/classroom');
  await page.getByRole('button', { name: /Create/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('教室名称').fill('a'.repeat(51));
  await dialog.getByLabel('教室地点').fill('Local room');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog.getByText(/50 characters/)).toBeVisible();
  expect(submitted).toBeUndefined();
  await dialog.getByLabel('教室名称').fill('中'.repeat(50));
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog).not.toBeVisible();
  expect(submitted).toMatchObject({
    c_name: '中'.repeat(50),
    address: 'Local room',
    c_seat_num: 1,
  });
  expect(errors).toEqual([]);
});
