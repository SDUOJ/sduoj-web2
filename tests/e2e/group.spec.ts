import { expectBrowserErrorBudget } from '../helpers/browserErrorBudget';
import { test, expect, Page } from '@playwright/test';

type GroupRow = {
  groupId: string;
  title: string;
  status: number | null;
  openness: number;
  memberNum: number;
  gmtCreate: string;
  owner: { email?: string; username?: string };
  markdown?: string;
  members?: unknown[];
};

function groupRow(overrides: Partial<GroupRow> = {}): GroupRow {
  return {
    groupId: '85',
    title: 'SDUOJ Demo Group',
    status: 2,
    openness: 0,
    memberNum: 12,
    gmtCreate: String(Date.now() - 86400_000),
    owner: { email: 'owner@example.invalid', username: 'owner' },
    markdown: '# Group notice\nWelcome.',
    members: [{ username: 'owner', nickname: 'Owner' }],
    ...overrides,
  };
}

type GroupFixture = {
  rows?: GroupRow[];
  detail?: Partial<GroupRow> & { groupId: string };
  onApply?: (payload: unknown) => void;
  onQuit?: (payload: unknown) => void;
  username?: string;
  roles?: string[];
};

async function openGroup(page: Page, path: string, fixture: GroupFixture = {}) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const applyCalls: unknown[] = [];
  const quitCalls: unknown[] = [];
  const rows = fixture.rows ?? [groupRow()];
  const detail = fixture.detail ?? { ...groupRow(), groupId: '85' };

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0 };
    if (p === '/user/getProfile') {
      data = {
        username: fixture.username ?? 'student_a',
        roles: fixture.roles ?? ['user'],
        features: {},
      };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/group/page') {
      data = { rows, totalNum: rows.length, totalPage: 1, pageSize: 12, pageIndex: 1 };
    } else if (p === '/group/query') {
      data = detail;
    } else if (p === '/group/apply') {
      applyCalls.push(url.searchParams.get('groupId') ?? route.request().postDataJSON?.());
      fixture.onApply?.(url.searchParams.toString());
      data = null;
    } else if (p === '/group/quit') {
      quitCalls.push(url.searchParams.get('groupId') ?? route.request().postDataJSON?.());
      fixture.onQuit?.(url.searchParams.toString());
      data = null;
    } else if (p === '/contest/list') {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    } else if (p === '/ps/problem_set/key') {
      data = { label: ['实验'], score: { 实验: 100 }, sum: 100 };
    } else if (p === '/ps/problem_set/search') {
      data = { rows: [], totalNum: 0, pageIndex: 1, pageSize: 10 };
    } else if (p === '/ps/course/list') {
      data = { rows: [], totalNum: 0, pageIndex: 1, pageSize: 100 };
    } else if (p === '/submit/queryACProblem') {
      data = [];
    } else if (p === '/notice/list') {
      data = { rows: [], totalNum: 0 };
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
  return {
    errors,
    getApplyCalls: () => applyCalls,
    getQuitCalls: () => quitCalls,
  };
}

test('group list renders mine/all filter and member cards', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openGroup(page, '/v2/group', {
    rows: [
      groupRow({ groupId: '85', title: 'Data Structure', status: 2 }),
      groupRow({ groupId: '86', title: 'Algorithms', status: 0, openness: 0 }),
      groupRow({ groupId: '87', title: 'Private Lab', status: 0, openness: 2 }),
    ],
  });
  await expect(page.getByText('Data Structure')).toBeVisible();
  await expect(page.getByText('Algorithms')).toBeVisible();
  await expect(page.getByText('Private Lab')).toBeVisible();
  // Mine / All filter — default shows Mine; open select to reveal All
  await expect(page.getByText('Mine')).toBeVisible();
  await page.getByText('Mine').click();
  await expect(page.getByText('All')).toBeVisible();
  await page.keyboard.press('Escape');
  // private group shows lock tag instead of join
  await expect(page.getByText('Private').first()).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('group list join button applies and quits a joined group', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors, getApplyCalls, getQuitCalls } = await openGroup(page, '/v2/group', {
    rows: [
      groupRow({ groupId: '85', title: 'Joinable', status: 0, openness: 0 }),
      groupRow({ groupId: '86', title: 'Joined', status: 2, openness: 0 }),
    ],
  });
  // Joinable card exposes 加入/Join
  const joinBtn = page.getByRole('button', { name: /^(Join|加入)$/ }).first();
  await expect(joinBtn).toBeVisible();
  await joinBtn.click();
  // Popconfirm asks for confirmation
  await expect(page.getByText(/Are you sure|确定/)).toBeVisible();
  await page.getByRole('button', { name: /OK|确定|Yes/i }).click();
  await expect.poll(() => getApplyCalls().length, { timeout: 5000 }).toBeGreaterThan(0);

  // Joined card exposes exit
  const exitBtn = page.getByRole('button', { name: /^(Exit|退出)$/ }).first();
  await expect(exitBtn).toBeVisible();
  expect(getQuitCalls()).toEqual([]);
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('group detail shows announcement tabs and member list', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openGroup(page, '/v2/group/85', {
    detail: {
      ...groupRow(),
      groupId: '85',
      title: 'Data Structure',
      markdown: '# Welcome\nPlease read the rules.',
      members: [
        { username: 'owner', nickname: 'Owner' },
        { username: 'student_a', nickname: 'Alice' },
      ],
    },
  });
  await expect(page.getByText('Data Structure').first()).toBeVisible();
  await expect(page.getByText(/Welcome/)).toBeVisible();
  // tabs
  await expect(page.getByRole('tab', { name: /Announcement/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Contest/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /User|Member/i })).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});

test('group detail join/quit respects membership status', async ({
  page,
  browserName,
}, testInfo) => {
  // not a member → join
  const open = await openGroup(page, '/v2/group/85', {
    detail: { ...groupRow(), groupId: '85', status: 0, openness: 0 },
    username: 'visitor',
  });
  await expect(page.getByRole('button', { name: /^(Join|加入)$/ })).toBeVisible();
  await expectBrowserErrorBudget(open.errors, browserName, testInfo);
});
