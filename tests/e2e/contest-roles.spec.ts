import { test, expect, Page } from '@playwright/test';

const now = Date.now();
const HOUR = 3600_000;

function contestInfo(overrides: Record<string, unknown> = {}) {
  return {
    contestId: '42',
    contestTitle: 'Role Matrix Contest',
    gmtStart: String(now - HOUR),
    gmtEnd: String(now + HOUR),
    features: {
      mode: 'acm',
      openness: 'public',
      frozenTime: 0,
      contestRunning: {
        displayPeerSubmission: 1,
        displayRank: 1,
        displayJudgeScore: 1,
        displayCheckpointResult: 1,
        allowToSubmit: 1,
      },
      contestEnd: {
        displayPeerSubmission: 1,
        displayRank: 1,
        displayJudgeScore: 1,
        displayCheckpointResult: 1,
        allowToSubmit: 0,
      },
    },
    isPublic: 1,
    markdownDescription: null,
    participants: [],
    participantNum: 1,
    username: 'organizer',
    problems: [
      {
        problemCode: '1',
        problemTitle: 'A+B',
        problemWeight: 1,
        problemColor: null,
        acceptNum: 0,
        submitNum: 0,
        judgeResult: null,
        judgeScore: null,
      },
    ],
    ...overrides,
  };
}

async function openContestAs(
  page: Page,
  path: string,
  opts: {
    username: string;
    roles: string[];
    participants?: string[];
    contest?: Record<string, unknown>;
    rankRows?: unknown[];
  },
) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const contest = contestInfo({
    participants: opts.participants ?? [],
    ...(opts.contest ?? {}),
  });
  await page.route('**/api/**', async (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown = null;
    if (p === '/user/getProfile') {
      data = { username: opts.username, roles: opts.roles, features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/contest/query') {
      data = contest;
    } else if (p === '/contest/rank') {
      data = opts.rankRows ?? [];
    } else if (p === '/contest/queryACProblem') {
      data = [];
    } else if (p === '/contest/listSubmission') {
      data = { rows: [], totalNum: 0, totalPage: 0 };
    } else {
      data = { rows: [], totalNum: 0, totalPage: 0 };
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
  return { errors };
}

test('student participant sees rank and problems but no admin export controls', async ({ page }) => {
  const { errors } = await openContestAs(page, '/v2/contest/42/rank', {
    username: 'student_a',
    roles: ['user'],
    participants: ['student_a'],
  });
  await expect(page.getByText('Role Matrix Contest')).toBeVisible({ timeout: 10000 });
  // student sees contest navigation
  await expect(page.getByRole('menuitem', { name: /Overview/i })).toBeVisible();
  // non-admin should not get export controls
  await expect(page.getByRole('button', { name: /^Export$/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('admin organizer sees export controls on rank', async ({ page }) => {
  const { errors } = await openContestAs(page, '/v2/contest/42/rank', {
    username: 'test_admin',
    roles: ['admin', 'superadmin'],
    participants: ['student_a'],
    rankRows: [
      {
        userId: '1',
        username: 'student_a',
        nickname: 'Alice',
        official: true,
        problemNum: 1,
        submissions: [['1', '600', 100, 1]],
        problemResults: null,
      },
    ],
  });
  await expect(page.getByText('Role Matrix Contest')).toBeVisible();
  await expect(page.getByText('Alice')).toBeVisible();
  // admin export button is present for organizers
  await expect(page.getByRole('button', { name: /Export/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('unregistered visitor on private contest is locked to register', async ({ page }) => {
  const { errors } = await openContestAs(page, '/v2/contest/42', {
    username: 'visitor',
    roles: ['user'],
    participants: [],
    contest: {
      features: {
        mode: 'acm',
        openness: 'private',
        frozenTime: 0,
        contestRunning: {
          displayPeerSubmission: 1,
          displayRank: 1,
          displayJudgeScore: 1,
          displayCheckpointResult: 1,
          allowToSubmit: 1,
        },
        contestEnd: {
          displayPeerSubmission: 1,
          displayRank: 1,
          displayJudgeScore: 1,
          displayCheckpointResult: 1,
          allowToSubmit: 0,
        },
      },
    },
  });
  await expect(page).toHaveURL(/\/contest\/42\/register/);
  await expect(page.getByRole('menuitem', { name: /Overview/i })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('auditor without membership still browses public contest overview', async ({ page }) => {
  const { errors } = await openContestAs(page, '/v2/contest/42/overview', {
    username: 'auditor',
    roles: ['user'],
    participants: ['student_a'],
  });
  await expect(page.getByText('Role Matrix Contest')).toBeVisible();
  await expect(page.getByText('A+B')).toBeVisible();
  expect(errors).toEqual([]);
});
