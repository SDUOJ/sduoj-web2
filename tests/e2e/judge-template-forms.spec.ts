import { test, expect, Page } from '@playwright/test';

type TemplateRow = {
  id: string;
  title: string;
  comment: string;
  username: string;
  gmtCreate: string;
  gmtModified: string;
};

function templateRow(overrides: Partial<TemplateRow> = {}): TemplateRow {
  return {
    id: '1',
    title: 'Standard IO',
    comment: 'default io template',
    username: 'admin',
    gmtCreate: String(Date.now()),
    gmtModified: String(Date.now()),
    ...overrides,
  };
}

async function openTemplate(page: Page, type: 'io' | 'advanced' = 'io') {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const createCalls: any[] = [];
  const updateCalls: any[] = [];

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : undefined;
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (p === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/manage/judgetemplate/page') {
      data = {
        rows: [templateRow()],
        totalNum: 1,
        totalPage: 1,
        pageSize: 10,
        pageIndex: 1,
      };
    } else if (p === '/manage/judgetemplate/create') {
      createCalls.push(body);
      data = { id: '9' };
    } else if (p === '/manage/judgetemplate/update') {
      updateCalls.push(body);
      data = null;
    } else if (p === '/manage/judgetemplate/query') {
      data = templateRow({ id: String(url.searchParams.get('id') ?? '1') });
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
  await page.goto(`/v2/manage/template/${type}`);
  return {
    errors,
    getCreateCalls: () => createCalls,
    getUpdateCalls: () => updateCalls,
  };
}

async function openCreateDialog(page: Page) {
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillShellScript(page: Page, dialog: ReturnType<Page['getByRole']>) {
  const code = dialog.locator('.cm-content[contenteditable=true]').first();
  if (await code.count()) {
    await code.click({ force: true });
    await page.keyboard.type('#!/bin/bash\ncat');
  }
}

test('io template form rejects blank title and overlong comment', async ({ page }) => {
  const { errors, getCreateCalls } = await openTemplate(page, 'io');
  const dialog = await openCreateDialog(page);

  // blank title must block
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(getCreateCalls()).toEqual([]);
  await expect(dialog.locator('.ant-form-item-explain-error').first()).toBeVisible();

  // overlong title (varchar 32)
  await dialog.getByLabel(/^Title$/i).fill('t'.repeat(33));
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(getCreateCalls()).toEqual([]);

  // overlong comment (varchar 255)
  await dialog.getByLabel(/^Title$/i).fill('Valid IO');
  await dialog
    .getByLabel(/note|comment/i)
    .first()
    .fill('c'.repeat(256));
  await fillShellScript(page, dialog);
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(getCreateCalls()).toEqual([]);
  expect(errors).toEqual([]);
});

test('io template form accepts a valid payload', async ({ page }) => {
  const { errors, getCreateCalls } = await openTemplate(page, 'io');
  const dialog = await openCreateDialog(page);

  await dialog.getByLabel(/^Title$/i).fill('Valid IO');
  await dialog
    .getByLabel(/note|comment/i)
    .first()
    .fill('ok');
  await fillShellScript(page, dialog);
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect.poll(() => getCreateCalls().length, { timeout: 5000 }).toBe(1);
  expect(getCreateCalls()[0]).toMatchObject({ title: 'Valid IO', type: 0 });
  expect(errors).toEqual([]);
});

test('advanced template form gates create the same way', async ({ page }) => {
  const { errors, getCreateCalls } = await openTemplate(page, 'advanced');
  const dialog = await openCreateDialog(page);
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(getCreateCalls()).toEqual([]);
  expect(errors).toEqual([]);
});

test('template edit dialog loads existing row and updates', async ({ page }) => {
  const { errors, getUpdateCalls } = await openTemplate(page, 'io');
  const row = page.getByRole('row', { name: /Standard IO/ });
  await row
    .getByRole('button', { name: /^Edit$/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel(/^Title$/i)).toHaveValue('Standard IO');
  await dialog.getByLabel(/^Title$/i).fill('Standard IO v2');
  await fillShellScript(page, dialog);
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect.poll(() => getUpdateCalls().length, { timeout: 5000 }).toBe(1);
  expect(getUpdateCalls()[0]).toMatchObject({ title: 'Standard IO v2', id: '1' });
  expect(errors).toEqual([]);
});
