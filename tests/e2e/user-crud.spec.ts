import { test, expect, Page } from '@playwright/test';

type UserRow = {
  userId: string;
  username: string;
  nickname: string;
  gender: number;
  studentId: string;
  sduId: string | null;
  email: string;
  roles: string[];
  features: Record<string, number>;
};

function userRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    userId: '13667',
    username: 'fe_94',
    nickname: 'Alice',
    gender: 2,
    studentId: '2024001',
    sduId: null,
    email: 'alice@example.invalid',
    roles: ['user'],
    features: { banThirdParty: 0, banEmailUpdate: 0, banInfoUpdate: 0 },
    ...overrides,
  };
}

type Fixture = {
  rows?: UserRow[];
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onAdd?: (payload: any) => void;
};

async function openUserManage(page: Page, fixture: Fixture = {}) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const updateCalls: any[] = [];
  const deleteCalls: any[] = [];
  const addCalls: any[] = [];
  let rows = fixture.rows ?? [userRow()];

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : undefined;
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (p === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['superadmin'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/manage/user/list') {
      data = { rows, totalNum: rows.length, totalPage: 1, pageSize: 10, pageIndex: 1 };
    } else if (p === '/manage/user/addUsers') {
      addCalls.push(body);
      fixture.onAdd?.(body);
      data = null;
    } else if (p === '/manage/user/update') {
      updateCalls.push(body);
      fixture.onUpdate?.(body);
      data = null;
    } else if (p === '/manage/user/delete') {
      deleteCalls.push(body);
      fixture.onDelete?.(body);
      data = null;
    } else {
      data = null;
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, message: '', timestamp: Date.now() },
    });
  });
  await page.goto('/v2/manage/user');
  return {
    errors,
    getUpdateCalls: () => updateCalls,
    getDeleteCalls: () => deleteCalls,
    getAddCalls: () => addCalls,
  };
}

async function advanceSteps(page: Page, dialog: ReturnType<Page['getByRole']>) {
  for (let i = 0; i < 4; i += 1) {
    const next = dialog.getByRole('button', { name: /^(Next|下一步)$/ });
    if (!(await next.count())) break;
    await next.first().click({ force: true });
    await page.waitForTimeout(120);
  }
  const finish = dialog.getByRole('button', { name: /^(Finish|Submit|完成|提交)$/ });
  if (await finish.count()) {
    await finish.first().click({ force: true });
    return true;
  }
  return false;
}

test('user list renders rows and opens edit dialog', async ({ page }) => {
  const { errors, getUpdateCalls } = await openUserManage(page, {
    rows: [userRow(), userRow({ userId: '2', username: 'fe_95', nickname: 'Bob' })],
  });
  await expect(page.getByRole('cell', { name: 'fe_94', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'fe_95', exact: true })).toBeVisible();

  // Edit opens dialog with username disabled
  const editBtn = page
    .getByRole('row', { name: /fe_94/ })
    .getByRole('button', { name: /Edit/i })
    .first();
  await editBtn.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel(/Username/i).first()).toBeDisabled();
  // nickname editable
  await dialog
    .getByLabel(/Nickname/i)
    .first()
    .fill('Alice Updated');
  await advanceSteps(page, dialog);
  await expect.poll(() => getUpdateCalls().length, { timeout: 5000 }).toBeGreaterThan(0);
  expect(getUpdateCalls()[0]).toMatchObject({ username: 'fe_94', userId: '13667' });
  expect(errors).toEqual([]);
});

test('user create validates username and submits a full profile', async ({ page }) => {
  const { errors, getAddCalls } = await openUserManage(page);
  await page
    .getByRole('button', { name: /AddUser|Add User|Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await dialog
    .getByLabel(/Username/i)
    .first()
    .fill('ab');
  await dialog.locator('input[type="password"]').nth(0).fill('Abcdef12');
  await dialog.locator('input[type="password"]').nth(1).fill('Abcdef12');
  await dialog.getByLabel(/Email/i).first().fill('ab@example.invalid');
  await advanceSteps(page, dialog);
  await expect(dialog).toBeVisible();
  expect(getAddCalls()).toEqual([]);

  await dialog
    .getByLabel(/Username/i)
    .first()
    .fill('valid_user02');
  await advanceSteps(page, dialog);
  await expect.poll(() => getAddCalls().length, { timeout: 5000 }).toBe(1);
  const payload = Array.isArray(getAddCalls()[0]) ? getAddCalls()[0][0] : getAddCalls()[0];
  expect(String(payload.username)).toContain('valid_user');
  expect(errors).toEqual([]);
});

test('user password change dialog submits admin password', async ({ page }) => {
  const { errors, getUpdateCalls } = await openUserManage(page);
  // superadmin sees More dropdown with Change Password
  const row = page.getByRole('row', { name: /fe_94/ });
  await row
    .getByRole('button', { name: /^More$/i })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Change Password/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // ItemPassword admin policy renders password + confirm
  const passwords = dialog.locator('input[type="password"]');
  await passwords.nth(0).fill('Abcdef12');
  await passwords.nth(1).fill('Abcdef12');
  await dialog
    .getByRole('button', { name: /^(Finish|Submit|OK|确定)$/i })
    .first()
    .click();
  await expect.poll(() => getUpdateCalls().length, { timeout: 5000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('batch delete sends selected usernames', async ({ page }) => {
  const { errors, getDeleteCalls } = await openUserManage(page, {
    rows: [userRow({ userId: '1' }), userRow({ userId: '2', username: 'fe_95' })],
  });
  // select both rows
  await page.locator('.ant-table-thead .ant-checkbox-input').first().check();
  await page
    .getByRole('button', { name: /Batch deletion/i })
    .first()
    .click();
  // DeleteConfirm is a Popconfirm with Yes/No
  await page.getByRole('button', { name: /^Yes$/i }).first().click();
  await expect.poll(() => getDeleteCalls().length, { timeout: 5000 }).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
