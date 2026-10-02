import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('AI bank uses real dev login, imports a native problem and renders on mobile', async ({
  page,
  request,
}) => {
  const state = path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration');
  const user = JSON.parse(fs.readFileSync(path.join(state, 'test-user.json'), 'utf8'));
  const report = JSON.parse(fs.readFileSync(path.join(state, 'report.json'), 'utf8'));
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    if (!['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect(login.ok()).toBeTruthy();
  expect((await login.json()).code).toBe(0);
  await page.goto('/v2/ai-bank');
  await expect(page.getByRole('heading', { name: 'AI 题库' })).toBeVisible();
  await expect(page.getByRole('button', { name: '导入 OJ 题目' })).toBeVisible();
  await page.getByRole('button', { name: '导入 OJ 题目' }).click();
  await page.getByLabel('题组 ID').fill(String(report.groups.programming));
  await page.getByLabel('题目 ID').fill(String(report.program_id));
  await page.getByRole('button', { name: /OK|确 定|确定/ }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: 'programming', exact: true }).first()).toBeVisible();
  await page.screenshot({ path: 'output/playwright/ai-bank-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: '新建草案' })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBeTruthy();
  await page.screenshot({ path: 'output/playwright/ai-bank-mobile.png', fullPage: true });
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
