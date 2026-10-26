import { expectBrowserErrorBudget } from '../helpers/browserErrorBudget';
import { test, expect, Page } from '@playwright/test';

const now = Date.now();
const DAY = 24 * 3600_000;

type LateRecord = {
  id: number;
  psid: number;
  username: string;
  discount: number;
  duration_minute: number | null;
  start_time: number | null;
  expire_time: number | string | null;
  note?: string | null;
  is_active: number;
};

function problemSetFixture(overrides: Record<string, unknown> = {}) {
  return {
    psid: 1,
    name: 'Late Matrix PS',
    description: null,
    type: 0,
    global_score: 100,
    tm_start: String(now - DAY),
    tm_end: String(now + DAY),
    groupId: 1,
    manageGroupId: 2,
    tag: 'exam',
    username: 'admin',
    isAdmin: true,
    config: {
      useSameSE: 0,
      showReport: 0,
      showScoreInRunning: 0,
      showProgramScoreInRunning: 0,
      mergerSubjectiveGroup: 0,
    },
    groupInfo: [],
    latePermission: null,
    ...overrides,
  };
}

type LateMatrixOptions = {
  problemSet: ReturnType<typeof problemSetFixture>;
  username?: string;
  roles?: string[];
  lateRows?: LateRecord[];
};

async function openProblemSet(
  page: Page,
  path: string,
  { problemSet, username = 'test_admin', roles = ['admin'], lateRows = [] }: LateMatrixOptions,
) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const addCalls: any[] = [];
  const updateCalls: any[] = [];
  let listRows = lateRows;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    const body = method === 'POST' ? route.request().postDataJSON() : undefined;
    let data: unknown = null;
    let code = 0;
    let status = 200;
    let message = '';
    if (pathname === '/user/getProfile') {
      data = { username, roles, features: {} };
    } else if (pathname === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (pathname === '/ps/problem_set/info_c') {
      data = problemSet;
    } else if (pathname === '/ps/course/list') {
      data = { rows: [], totalNum: 0, pageIndex: 1, pageSize: 100 };
    } else if (pathname === '/ps/judge/list') {
      data = { rows: [], totalNum: 0, pageIndex: 1, pageSize: 20 };
    } else if (pathname === '/ps/problem_set/late/list') {
      data = { pageIndex: 1, pageSize: 10, totalNum: listRows.length, rows: listRows };
    } else if (pathname === '/ps/problem_set/late/add') {
      addCalls.push(body);
      listRows = [
        {
          id: 99,
          psid: body.psid,
          username: body.username,
          discount: body.discount,
          duration_minute: null,
          start_time: null,
          expire_time: body.expire_time,
          note: body.note ?? null,
          is_active: 1,
        },
        ...listRows,
      ];
      data = null;
    } else if (pathname === '/ps/problem_set/late/update') {
      updateCalls.push(body);
      listRows = listRows.map((row) =>
        row.id === body.id
          ? {
              ...row,
              discount: body.discount ?? row.discount,
              note: body.note ?? row.note,
              is_active: body.is_active === undefined ? row.is_active : body.is_active ? 1 : 0,
            }
          : row,
      );
      data = null;
    } else if (pathname === '/ps/summary/summary') {
      data = {
        data: [
          {
            username: 'alice',
            nickname: 'Alice',
            rank: 1,
            ips: ['10.0.0.1', '10.0.0.2'],
            finish: 1,
            finish_time: now - 1000,
            sum_score: 90,
          },
          {
            username: 'bob',
            nickname: 'Bob',
            rank: 2,
            ips: ['10.0.0.3'],
            finish: 0,
            finish_time: null,
            sum_score: 40,
          },
        ],
        lastUpdate: now,
      };
    } else if (pathname === '/submit/queryACProblem') {
      data = [];
    } else if (pathname === '/notice/list') {
      data = { rows: [], totalNum: 0 };
    } else {
      // tolerate unknown auxiliary calls
      data = { rows: [], totalNum: 0, pageIndex: 1, pageSize: 10 };
    }
    await route.fulfill({
      status,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code, data, message, timestamp: Date.now() },
    });
  });
  await page.goto(path);
  return {
    errors,
    getAddCalls: () => addCalls,
    getUpdateCalls: () => updateCalls,
  };
}

test('late permission page denies non-admins with a 403 result', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openProblemSet(page, '/v2/problemSet/1/late', {
    problemSet: problemSetFixture({ isAdmin: false }),
    username: 'student',
    roles: ['user'],
  });
  await expect(page.getByText('403')).toBeVisible();
  await expect(page.getByText(/do not have permission/i)).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('late permission list renders granted rows for admins', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openProblemSet(page, '/v2/problemSet/1/late', {
    problemSet: problemSetFixture(),
    lateRows: [
      {
        id: 1,
        psid: 1,
        username: 'yhf2000',
        discount: 0.5,
        duration_minute: 5400,
        start_time: now - DAY,
        expire_time: now + DAY,
        note: 'extension',
        is_active: 1,
      },
    ],
  });
  await expect(page.getByRole('button', { name: /Grant Late Permission/i })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'yhf2000' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'extension' })).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('late permission add rejects empty username and out-of-range discount', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors, getAddCalls } = await openProblemSet(page, '/v2/problemSet/1/late', {
    problemSet: problemSetFixture(),
    lateRows: [],
  });
  await page.getByRole('button', { name: /Grant Late Permission/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const username = dialog.locator('input').first();
  const discount = dialog.getByRole('spinbutton').first();
  await dialog.getByLabel(/Expire time/i).fill('2099-01-01 00:00:00');
  await discount.fill('0.5');
  await dialog.getByRole('button', { name: /^OK$/ }).click();
  await expect(dialog).toBeVisible();
  expect(getAddCalls()).toEqual([]);

  await username.fill('   ');
  await dialog.getByRole('button', { name: /^OK$/ }).click();
  await expect(dialog).toBeVisible();
  expect(getAddCalls()).toEqual([]);

  await username.fill('late_user');
  await discount.fill('0');
  await dialog.getByRole('button', { name: /^OK$/ }).click();
  await expect(dialog).toBeVisible();
  expect(getAddCalls()).toEqual([]);

  // InputNumber clamps >1 back to 1; the exclusive-min(0) rule is the real gate.
  await discount.fill('0.01');
  await dialog.getByRole('button', { name: /^OK$/ }).click();
  await expect.poll(() => getAddCalls().length, { timeout: 5000 }).toBe(1);
  expect(getAddCalls()[0]).toMatchObject({
    psid: 1,
    username: 'late_user',
    discount: 0.01,
  });
  expect(getAddCalls()[0].expire_time).toBeGreaterThan(Date.now());
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('late permission edit updates discount', async ({ page, browserName }, testInfo) => {
  const { errors, getUpdateCalls } = await openProblemSet(page, '/v2/problemSet/1/late', {
    problemSet: problemSetFixture(),
    lateRows: [
      {
        id: 7,
        psid: 1,
        username: 'editable',
        discount: 0.8,
        duration_minute: null,
        start_time: null,
        expire_time: now + DAY,
        note: null,
        is_active: 1,
      },
    ],
  });
  const row = page.getByRole('row', { name: /editable/ });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /Edit/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input').first()).toBeDisabled();
  await dialog.getByRole('spinbutton').first().fill('0.25');
  await dialog.getByRole('button', { name: /^OK$/ }).click();
  await expect.poll(() => getUpdateCalls().length, { timeout: 5000 }).toBe(1);
  expect(getUpdateCalls()[0]).toMatchObject({
    psid: 1,
    id: 7,
    discount: 0.25,
  });
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('monitor page surfaces multi-ip users', async ({ page, browserName }, testInfo) => {
  const { errors } = await openProblemSet(page, '/v2/problemSet/1/monitor', {
    problemSet: problemSetFixture(),
  });
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'alice', exact: true })).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('review page stays reachable for admins', async ({ page, browserName }, testInfo) => {
  const { errors } = await openProblemSet(page, '/v2/problemSet/1/review', {
    problemSet: problemSetFixture(),
  });
  await expect(page.getByText(/Late Matrix PS|Review/i).first()).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});
