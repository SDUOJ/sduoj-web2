import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('AI question intake and revision workspace runs against deterministic dev fixtures', async ({
  page,
}) => {
  const state = path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration');
  const user = JSON.parse(fs.readFileSync(path.join(state, 'test-user.json'), 'utf8'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const question = {
    id: 'fixture-question',
    kind: 'question',
    version: 1,
    state: 'ready',
    data: {
      question_type: 'short_answer',
      language: 'zh',
      original: 'What is FIFO?',
      zh: '什么是 FIFO？',
      options: [],
      answer: '先进先出',
      tags: [],
    },
  };
  const collection = {
    id: 'fixture-collection',
    kind: 'collection',
    version: 2,
    state: 'ready',
    data: { title: '数据结构夹具题集' },
  };
  const envelope = (data: unknown) => ({ code: 0, timestamp: Date.now(), data });

  await page.route('**/api/ps/auto-task/ai/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    if (pathname.endsWith('/account')) {
      return route.fulfill({
        json: envelope({ subject_id: String(user.userId), status: 'active', balance: '0' }),
      });
    }
    if (pathname.endsWith('/capabilities')) {
      return route.fulfill({
        json: envelope({ admin: false, sandbox_enabled: false }),
      });
    }
    if (pathname.endsWith('/collection-collaboration/list')) {
      return route.fulfill({ json: envelope([]) });
    }
    if (pathname.endsWith('/resources/list')) {
      const body = request.postDataJSON();
      return route.fulfill({
        json: envelope({
          rows: body.kind === 'collection' ? [collection] : [question],
          totalNum: 1,
        }),
      });
    }
    if (pathname.endsWith('/question-workflows/intake')) {
      return route.fulfill({
        json: envelope({ collection, taskId: 'fixture-intake-job', batch_id: 'fixture-batch' }),
      });
    }
    if (pathname.includes('/question-workflows/questions/') && pathname.endsWith('/followup')) {
      return route.fulfill({ json: envelope({ taskId: 'fixture-solve-job', status: 'pending' }) });
    }
    if (pathname.includes('/jobs/')) {
      return route.fulfill({
        json: envelope({ id: pathname.split('/').pop(), status: 'success' }),
      });
    }
    if (pathname.endsWith('/resources/fixture-question')) {
      return route.fulfill({
        json: envelope({ ...question, version: 2, data: { ...question.data, answer: '先进先出' } }),
      });
    }
    if (pathname.endsWith('/question-workflows/collections/fixture-collection/manifest')) {
      return route.fulfill({
        json: envelope({
          resource_id: collection.id,
          version: 2,
          question_ids: [question.id],
          items: [
            { number: 3, question_id: question.id, batch_id: 'fixture-batch', status: 'active' },
          ],
        }),
      });
    }
    if (pathname.endsWith('/question-workflows/collections/fixture-collection/questions')) {
      return route.fulfill({
        json: envelope({
          rows: [{ number: 3, resource: question }],
          totalNum: 1,
          pageIndex: 1,
          pageSize: 100,
          unavailable_numbers: [],
        }),
      });
    }
    return route.fulfill({ status: 404, json: { detail: 'Unhandled fixture route' } });
  });

  const login = await page.request.post('/api/user/login', {
    data: { username: user.username, password: user.password },
  });
  expect(login.ok()).toBeTruthy();
  await page.goto('/v2/ai-bank');
  await expect(page.getByRole('heading', { name: 'AI 题库' })).toBeVisible();
  await page.getByRole('button', { name: /录题与修订/ }).click({ force: true });
  await expect(page.getByRole('dialog', { name: '录题与修订' })).toBeVisible();
  const questionSelectInput = page
    .getByRole('dialog', { name: '录题与修订' })
    .locator('input[aria-label="选择题目"]');
  await questionSelectInput.focus();
  await questionSelectInput.fill('什么是 FIFO？');
  await page
    .locator('.ant-select-item-option')
    .filter({ hasText: '什么是 FIFO？' })
    .click({ force: true });
  await page
    .getByRole('dialog', { name: '录题与修订' })
    .getByRole('button', { name: '解答', exact: true })
    .click({ force: true });
  await expect(
    page.getByRole('dialog', { name: '录题与修订' }).getByText('先进先出', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: /自动录题/ }).click();
  await page.getByLabel('题目文本').fill('1. 什么是栈？');
  await page.getByRole('button', { name: /OK|确 定|确定/ }).click();
  await expect(page.getByRole('dialog', { name: '自动录题' })).toHaveCount(0);

  await page.getByRole('button', { name: '查看编号' }).click();
  await expect(page.getByRole('cell', { name: '3', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'fixture-batch' })).toBeVisible();
  expect(errors).toEqual([]);
});
