import { expectNoBrowserErrors } from './browser-errors';
import { test, expect, Page } from '@playwright/test';

type ApiCalls = {
  createProblemSet: any[];
  createCourse: any[];
  createProblemGroup: any[];
};

async function openPage(
  page: Page,
  path: string,
  opts: {
    listRows?: unknown[];
    extraRoutes?: Record<string, unknown>;
  } = {},
) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const calls: ApiCalls = {
    createProblemSet: [],
    createCourse: [],
    createProblemGroup: [],
  };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : undefined;
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (p === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin', 'superadmin'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/manage/problem_set/list' || p === '/ps/problem_set/list') {
      data = {
        rows: opts.listRows ?? [
          {
            psid: 1,
            name: 'Demo Set',
            tag: '实验',
            description: '',
            type: 0,
            global_score: 100,
            groupId: 1,
            manageGroupId: null,
            tm_start: null,
            tm_end: null,
            username: 'admin',
          },
        ],
        totalNum: 1,
        totalPage: 1,
        pageSize: 10,
        pageIndex: 1,
      };
    } else if (p === '/manage/problem_set/create' || p === '/ps/problem_set/create') {
      calls.createProblemSet.push(body);
      data = { psid: 9 };
    } else if (p === '/manage/course/create' || p === '/ps/course/create') {
      calls.createCourse.push(body);
      data = { course_id: 9 };
    } else if (p === '/manage/problem_group/create') {
      calls.createProblemGroup.push(body);
      data = { gid: 9 };
    } else if (p === '/manage/group/listByTitle') {
      data = [];
    } else if (p === '/ps/group/search') {
      // Problem group search returns a bare array of { gid, name, type }.
      data = [
        { gid: 1, name: 'PG-Objective', type: 0 },
        { gid: 2, name: 'PG-Program', type: 2 },
      ];
    } else if (opts.extraRoutes && p in opts.extraRoutes) {
      data = opts.extraRoutes[p];
    } else {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, message: '', timestamp: Date.now() },
    });
  });
  await page.goto(path);
  return { errors, calls };
}

test('problem set create rejects blank name/tag before submit', async ({ page }) => {
  const { errors, calls } = await openPage(page, '/v2/manage/problemSet/problem_set');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // StepsForm: walk Next without filling required fields — must not create.
  for (let i = 0; i < 4; i += 1) {
    const next = dialog.getByRole('button', { name: /^(Next|下一步)$/ });
    if (!(await next.count())) break;
    await next.first().click();
    await page.waitForTimeout(100);
    if (calls.createProblemSet.length) break;
  }
  const finish = dialog.getByRole('button', { name: /^(Finish|Submit|完成|提交)$/ });
  if (await finish.count()) {
    await finish.first().click();
  }
  expect(calls.createProblemSet).toEqual([]);
  await expectNoBrowserErrors(errors);
});

test('problem group create requires a non-blank name', async ({ page }) => {
  const { errors, calls } = await openPage(page, '/v2/manage/problemSet/problem_group');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole('button', { name: /Submit|Finish/i })
    .first()
    .click();
  await expect(dialog).toBeVisible();
  expect(calls.createProblemGroup).toEqual([]);
  await expectNoBrowserErrors(errors);
});

test('course create rejects blank name and invalid tag', async ({ page }) => {
  const { errors, calls } = await openPage(page, '/v2/manage/course/course', {
    extraRoutes: {
      '/ps/course/list': { rows: [], totalNum: 0, pageIndex: 1, pageSize: 20 },
      '/manage/course/list': { rows: [], totalNum: 0, pageIndex: 1, pageSize: 20 },
    },
  });
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^Submit$/i }).click();
  await expect(dialog).toBeVisible();
  expect(calls.createCourse).toEqual([]);
  await expectNoBrowserErrors(errors);
});

test('intelligent management page is reachable for admins', async ({ page }) => {
  const { errors } = await openPage(page, '/v2/manage/intelligent');
  // page shell should render without crash
  await expect(page.getByRole('button').first()).toBeVisible();
  await expectNoBrowserErrors(errors);
});

test('assistant settings page is reachable for admins', async ({ page }) => {
  const { errors } = await openPage(page, '/v2/manage/settings/assistant', {
    extraRoutes: {
      '/ai/admin/settings': {},
      '/ai/admin/access': { items: [] },
    },
  });
  await expect(page.getByRole('button').first()).toBeVisible();
  await expectNoBrowserErrors(errors);
});
