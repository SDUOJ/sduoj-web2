import { test, expect, Page } from '@playwright/test';

async function openAnnouncementManage(page: Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let created: any;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (pathname === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin'], features: {} };
    } else if (pathname === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (pathname === '/manage/notice/list') {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    } else if (pathname === '/manage/notice/create' || pathname === '/manage/notice/update') {
      created = route.request().postDataJSON();
      data = { noticeId: 1 };
    } else {
      data = null;
    }
    await route.fulfill({
      json: { code: 0, data, message: '', timestamp: Date.now() },
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
    });
  });
  await page.goto('/v2/manage/announcement');
  await page.getByRole('button', { name: /Create/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return {
    dialog,
    errors,
    getCreated: () => created,
  };
}

async function fillVditor(page: Page, text: string) {
  // Vditor mounts several contenteditable surfaces (including hidden ones).
  const editor = page
    .locator('.vditor [contenteditable="true"]')
    .filter({ hasNot: page.locator('[aria-hidden="true"]') })
    .last();
  await editor.scrollIntoViewIfNeeded();
  await editor.click({ force: true });
  await page.keyboard.type(text);
  await expect(editor).toContainText(text.slice(0, 10));
}

test('announcement form blocks blank titles and accepts a valid notice', async ({ page }) => {
  const { dialog, errors, getCreated } = await openAnnouncementManage(page);
  await dialog.getByRole('button', { name: /^Submit$/ }).click();
  await expect(dialog).toBeVisible();
  expect(getCreated()).toBeUndefined();
  await expect(dialog.locator('.ant-form-item-explain-error').first()).toBeVisible();

  await dialog.getByLabel('Title').fill('a'.repeat(46));
  await fillVditor(page, 'x');
  await dialog.getByRole('button', { name: /^Submit$/ }).click();
  await expect(dialog).toBeVisible();
  expect(getCreated()).toBeUndefined();

  await dialog.getByLabel('Title').fill('Maintenance window');
  await fillVditor(page, 'Service will restart at midnight.');
  await dialog.getByRole('button', { name: /^Submit$/ }).click();
  await expect.poll(() => getCreated(), { timeout: 5000 }).toBeTruthy();
  expect(getCreated()).toMatchObject({ title: 'Maintenance window' });
  expect(errors).toEqual([]);
});

async function openUserManage(page: Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let created: any;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (pathname === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['superadmin'], features: {} };
    } else if (pathname === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (pathname === '/manage/user/list') {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    } else if (pathname === '/manage/user/addUsers' || pathname === '/manage/user/update') {
      created = route.request().postDataJSON();
      data = null;
    } else {
      data = null;
    }
    await route.fulfill({
      json: { code: 0, data, message: '', timestamp: Date.now() },
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
    });
  });
  await page.goto('/v2/manage/user');
  await page
    .getByRole('button', { name: /AddUser|Add User|Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return {
    dialog,
    errors,
    getCreated: () => created,
  };
}

async function fillUserBasics(dialog: ReturnType<Page['getByRole']>, username: string) {
  await dialog.getByLabel(/Username/i).first().fill(username);
  const passwordFields = dialog.locator('input[type="password"]');
  await passwordFields.nth(0).fill('Abcdef12');
  await passwordFields.nth(1).fill('Abcdef12');
  await dialog.getByLabel(/Email/i).first().fill(`${username}@example.invalid`);
}

async function advanceUserDialog(page: Page, dialog: ReturnType<Page['getByRole']>) {
  // StepsForm: "Next" while more steps remain; the terminal action is "Submit"/"Finish".
  for (let i = 0; i < 4; i += 1) {
    const next = dialog.getByRole('button', { name: /^(Next|下一步)$/ });
    if (!(await next.count())) break;
    await next.first().click({ force: true });
    // Step 2 owns the feature switches; wait for them before finishing.
    if (i === 0) {
      await expect(dialog.getByText(/Third|Email|Info/i).first()).toBeVisible({ timeout: 3000 });
    }
  }
  const finish = dialog.getByRole('button', { name: /^(Finish|Submit|完成|提交)$/ });
  if (await finish.count()) {
    await finish.first().click({ force: true });
    return true;
  }
  return false;
}

test('user management create rejects weak usernames and accepts a valid profile', async ({
  page,
}) => {
  const { dialog, errors, getCreated } = await openUserManage(page);

  await fillUserBasics(dialog, 'ab');
  await advanceUserDialog(page, dialog);
  await expect(dialog).toBeVisible();
  expect(getCreated()).toBeUndefined();

  await fillUserBasics(dialog, 'valid_user01');
  const submitted = await advanceUserDialog(page, dialog);
  expect(submitted).toBe(true);
  await expect.poll(() => getCreated(), { timeout: 5000 }).toBeTruthy();
  const payload = getCreated();
  const flat = Array.isArray(payload) ? payload[0] : payload;
  expect(String(flat?.username ?? '')).toContain('valid_user');
  expect(errors).toEqual([]);
});
