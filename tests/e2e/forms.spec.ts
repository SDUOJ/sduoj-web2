import { test, expect } from '@playwright/test';

async function openClassroomDialog(page: import('@playwright/test').Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  let submitted: unknown;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
  return {
    dialog,
    getSubmitted: () => submitted,
    errors,
  };
}

test('classroom form blocks storage overflow and submits a valid boundary value', async ({
  page,
  isMobile,
}) => {
  const { dialog, getSubmitted, errors } = await openClassroomDialog(page);
  await dialog.getByLabel('教室名称').fill('a'.repeat(51));
  await dialog.getByLabel('教室地点').fill('Local room');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog.getByText(/50 characters/)).toBeVisible();
  expect(getSubmitted()).toBeUndefined();
  await dialog.getByLabel('教室名称').fill('中'.repeat(50));
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog).not.toBeVisible();
  expect(getSubmitted()).toMatchObject({
    c_name: '中'.repeat(50),
    address: 'Local room',
    c_seat_num: 1,
  });
  if (isMobile) {
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('classroom seat input never submits a non-positive or non-integer seat', async ({ page }) => {
  const { dialog, getSubmitted, errors } = await openClassroomDialog(page);
  await dialog.getByLabel('教室名称').fill('Lab');
  await dialog.getByLabel('教室地点').fill('A-101');
  await dialog.getByLabel('座位数量').fill('0');
  await dialog.getByRole('button', { name: /Submit/ }).click();
  // InputNumber(min=1) 会钳位或拦截；无论是否提交，都不得写出非法座位
  const payload = getSubmitted() as { c_seat_num?: number } | undefined;
  if (payload) {
    expect(Number.isInteger(payload.c_seat_num)).toBe(true);
    expect(payload.c_seat_num).toBeGreaterThanOrEqual(1);
    await expect(dialog).not.toBeVisible();
  } else {
    await expect(dialog).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('classroom form rejects empty required name and overlong names', async ({ page }) => {
  const { dialog, getSubmitted, errors } = await openClassroomDialog(page);
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog).toBeVisible();
  expect(getSubmitted()).toBeUndefined();
  await expect(dialog.locator('.ant-form-item-explain-error').first()).toBeVisible();

  await dialog.getByLabel('教室名称').fill('a'.repeat(51));
  await dialog.getByLabel('教室地点').fill('A-101');
  await dialog.getByLabel('座位数量').fill('1');
  await dialog.getByRole('button', { name: /Submit/ }).click();
  await expect(dialog).toBeVisible();
  expect(getSubmitted()).toBeUndefined();
  await expect(dialog.getByText(/50 characters/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile management navigation opens as a drawer and keeps the form usable', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'The drawer interaction is specific to mobile viewports.');
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0 };
    if (path === '/user/getProfile')
      data = { username: 'test_admin', roles: ['admin'], features: {} };
    if (path === '/site/getCopyright') data = 'SDUOJ';
    await route.fulfill({
      json: { code: path === '/user/getProfile' ? 0 : 0, data, timestamp: Date.now() },
    });
  });
  await page.goto('/v2/manage/course/classroom');
  const menuButton = page.getByRole('button', { name: /Open menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  await expect(page.locator('.ant-drawer-content .ant-menu').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: /Create/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('教室名称')).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box?.width ?? 0).toBeLessThanOrEqual(page.viewportSize()!.width);
});
