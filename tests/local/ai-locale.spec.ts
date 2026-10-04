import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.use({ trace: 'off' });

test('English AI routes and creation forms translate UI with real local authorization', async ({
  page,
  baseURL,
}) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  ) as { username: string; password: string };
  const errors: string[] = [];
  const failures: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().includes('/api/ps/auto-task/ai') && response.status() >= 400)
      failures.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  );
  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect((await login.json()).code).toBe(0);

  for (const [url, heading] of [
    ['/v2/ai-workbench', 'Tasks and authoring'],
    ['/v2/ai-exams', 'Exams and invigilation'],
    ['/v2/ai-plagiarism', 'Code plagiarism'],
  ]) {
    await page.goto(url);
    await expect(page.getByRole('navigation', { name: 'AI workspace' })).toBeVisible();
    await expect(page.getByRole('menu').first()).not.toContainText(/[\u3400-\u9fff]/);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Checking OJ login' })).toHaveCount(0);
    if (url === '/v2/ai-exams') {
      await page.getByRole('button', { name: 'New exam' }).click();
      await expect(page.getByLabel('Exam name', { exact: true })).toBeVisible();
      await expect(page.getByPlaceholder('Student ID,Name,OJ username')).toBeVisible();
      await expect(page.getByRole('dialog')).not.toContainText(/[\u3400-\u9fff]/);
    }
    if (url === '/v2/ai-plagiarism') {
      await page.getByRole('button', { name: /New/ }).click();
      await expect(page.getByLabel('Similarity threshold', { exact: true })).toBeVisible();
      await expect(page.getByRole('dialog')).not.toContainText(/[\u3400-\u9fff]/);
    }
  }
  await page.goto('/v2/manage/problemSet/problem_group');
  await page.getByRole('button', { name: 'Batch question intake' }).click();
  await expect(page.getByRole('tab', { name: 'Manual entry' })).toBeVisible();
  await expect(page.getByLabel('Question content', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Text / file recognition' }).click();
  await expect(
    page.getByRole('button', { name: 'Recognize and save to question groups' }),
  ).toBeVisible();
  await expect(page.locator('.ant-drawer-body')).not.toContainText(/[\u3400-\u9fff]/);
  expect(errors).toEqual([]);
  expect(failures).toEqual([]);
});
