import { expectNoBrowserErrors } from './browser-errors';
import { test, expect, Page } from '@playwright/test';

type ContestFeatures = {
  mode: string;
  openness: 'public' | 'protected' | 'private';
  frozenTime: number;
  contestRunning: {
    displayPeerSubmission: number;
    displayRank: number;
    displayJudgeScore: number;
    displayCheckpointResult: number;
    allowToSubmit: number;
  };
  contestEnd: {
    displayPeerSubmission: number;
    displayRank: number;
    displayJudgeScore: number;
    displayCheckpointResult: number;
    allowToSubmit: number;
  };
};

type ContestFixture = {
  contestId: string;
  contestTitle: string;
  gmtStart: string;
  gmtEnd: string;
  features: ContestFeatures;
  isPublic: number;
  markdownDescription: string | null;
  participants: string[];
  participantNum: number;
  username: string;
  problems: Array<{
    problemCode: string;
    problemTitle: string;
    problemWeight: number;
    problemColor: string | null;
    acceptNum: number;
    submitNum: number;
    judgeResult: number | null;
    judgeScore: number | null;
  }>;
};

const now = Date.now();
const HOUR = 3600_000;

function baseFeatures(overrides: Partial<ContestFeatures> = {}): ContestFeatures {
  return {
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
    ...overrides,
  };
}

function contestFixture(overrides: Partial<ContestFixture> = {}): ContestFixture {
  return {
    contestId: '42',
    contestTitle: 'Matrix Contest',
    gmtStart: String(now - HOUR),
    gmtEnd: String(now + HOUR),
    features: baseFeatures(),
    isPublic: 1,
    markdownDescription: null,
    participants: [],
    participantNum: 0,
    username: 'organizer',
    problems: [
      {
        problemCode: '1',
        problemTitle: 'A + B',
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

type MatrixOptions = {
  contest: ContestFixture;
  username?: string;
  roles?: string[];
  rankRows?: unknown[];
  participatePayload?: unknown;
  onParticipate?: (payload: unknown) => void;
};

async function openContest(
  page: Page,
  path: string,
  {
    contest,
    username = 'student_a',
    roles = ['user'],
    rankRows = [],
    participatePayload,
    onParticipate,
  }: MatrixOptions,
) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const participateCalls: unknown[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    const method = route.request().method();
    let data: unknown = null;
    let code = 0;
    let status = 200;
    if (pathname === '/user/getProfile') {
      data = { username, roles, features: {} };
    } else if (pathname === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (pathname === '/contest/query') {
      data = contest;
    } else if (pathname === '/contest/rank') {
      data = rankRows;
    } else if (pathname === '/contest/participate' && method === 'POST') {
      const payload = route.request().postDataJSON();
      participateCalls.push(payload);
      onParticipate?.(payload);
      data = participatePayload ?? null;
    } else if (pathname === '/contest/queryProblem') {
      data = {
        problemCode: '1',
        problemTitle: 'A + B',
        markdownDescription: 'sum',
        judgeTemplates: [],
      };
    } else if (pathname === '/contest/listSubmission') {
      data = { rows: [], totalNum: 0, totalPage: 0 };
    } else if (pathname === '/submit/queryACProblem') {
      data = [];
    } else if (pathname === '/notice/list') {
      data = { rows: [], totalNum: 0 };
    } else {
      throw new Error(`Missing API fixture: ${method} ${pathname}`);
    }
    await route.fulfill({
      status,
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code, data, message: code ? 'forbidden' : '', timestamp: Date.now() },
    });
  });
  await page.goto(path);
  return {
    errors,
    getParticipateCalls: () => participateCalls,
  };
}

test('public contest register joins without a password and lands on overview', async ({ page }) => {
  const contest = contestFixture({
    features: baseFeatures({ openness: 'public' }),
  });
  const { errors, getParticipateCalls } = await openContest(page, '/v2/contest/42/register', {
    contest,
  });
  await expect(page.getByRole('button', { name: /^Register$/ })).toBeVisible();
  await expect(page.getByLabel(/Contest password/i)).toHaveCount(0);
  await page.getByRole('button', { name: /^Register$/ }).click();
  await expect(page).toHaveURL(/\/contest\/42\/overview/);
  expect(getParticipateCalls()).toEqual([{ contestId: '42' }]);
  await expectNoBrowserErrors(errors);
});

test('protected contest register requires a password before joining', async ({ page }) => {
  const contest = contestFixture({
    features: baseFeatures({ openness: 'protected' }),
  });
  const { errors, getParticipateCalls } = await openContest(page, '/v2/contest/42/register', {
    contest,
  });
  const password = page.getByLabel(/Contest password/i);
  await expect(password).toBeVisible();
  await page.getByRole('button', { name: /^Register$/ }).click();
  expect(getParticipateCalls()).toEqual([]);
  await password.fill('secret');
  await page.getByRole('button', { name: /^Register$/ }).click();
  await expect(page).toHaveURL(/\/contest\/42\/overview/);
  expect(getParticipateCalls()).toEqual([{ contestId: '42', password: 'secret' }]);
  await expectNoBrowserErrors(errors);
});

test('private contest keeps unregistered users on register-only navigation', async ({ page }) => {
  const contest = contestFixture({
    features: baseFeatures({ openness: 'private' }),
    participants: [],
  });
  const { errors } = await openContest(page, '/v2/contest/42', {
    contest,
    username: 'outsider',
  });
  await expect(page).toHaveURL(/\/contest\/42\/register/);
  await expect(page.getByRole('button', { name: /^Register$/ })).toBeVisible();
  await expect(page.getByText(/Contest password/i)).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Overview/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /Register/i })).toBeVisible();
  await expectNoBrowserErrors(errors);
});

test('already-registered users are redirected away from the register page', async ({ page }) => {
  const contest = contestFixture({
    features: baseFeatures({ openness: 'public' }),
    participants: ['student_a'],
  });
  const { errors } = await openContest(page, '/v2/contest/42/register', {
    contest,
    username: 'student_a',
  });
  await expect(page).toHaveURL(/\/contest\/42\/overview/);
  await expect(page.getByRole('button', { name: /^Register$/ })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /Register/i })).toHaveCount(0);
  await expect(page.getByText('A + B')).toBeVisible();
  await expectNoBrowserErrors(errors);
});

test('wait-state contests only expose the register navigation entry', async ({ page }) => {
  const contest = contestFixture({
    gmtStart: String(now + HOUR),
    gmtEnd: String(now + 2 * HOUR),
    features: baseFeatures({ openness: 'public' }),
  });
  const { errors } = await openContest(page, '/v2/contest/42/register', {
    contest,
    username: 'early_bird',
  });
  await expect(page.getByText(/Time until start/i)).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Register/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /Overview/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /Rank/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /Submission List/i })).toHaveCount(0);
  await expectNoBrowserErrors(errors);
});

test('rank page renders sealed-board style rows from the contest rank feed', async ({ page }) => {
  const contest = contestFixture({
    features: baseFeatures({ openness: 'public', frozenTime: 30 }),
    participants: ['student_a', 'student_b'],
    participantNum: 2,
  });
  const rankRows = [
    {
      userId: '1',
      username: 'student_a',
      nickname: 'Alice',
      official: true,
      problemNum: 1,
      submissions: [
        ['1', '600', 100, 1],
        ['1', '700', 100, 1],
      ],
      problemResults: [['600', 100, 1, 1, 0]],
    },
    {
      userId: '2',
      username: 'student_b',
      nickname: 'Bob',
      official: true,
      problemNum: 1,
      submissions: null,
      problemResults: null,
    },
  ];
  const { errors } = await openContest(page, '/v2/contest/42/rank', {
    contest,
    username: 'student_a',
    rankRows,
  });
  await expect(page.getByText('Alice')).toBeVisible();
  await expect(page.getByText('Bob')).toBeVisible();
  await expect(page.getByText('Matrix Contest')).toBeVisible();
  await expectNoBrowserErrors(errors);
});

async function openContestCreateDialog(page: Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let submitted: any;
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    if (pathname === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin'], features: {} };
    } else if (pathname === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (pathname === '/manage/contest/page') {
      data = { rows: [], totalNum: 0, totalPage: 0, pageSize: 10, pageIndex: 1 };
    } else if (pathname === '/manage/contest/create' || pathname === '/manage/contest/update') {
      submitted = route.request().postDataJSON();
      data = { contestId: '42' };
    } else if (pathname === '/manage/group/listByTitle') {
      data = [];
    } else {
      throw new Error(`Missing API fixture: ${pathname}`);
    }
    await route.fulfill({
      json: { code: 0, data, message: '', timestamp: Date.now() },
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
    });
  });
  await page.goto('/v2/manage/contest');
  await page
    .getByRole('button', { name: /Create/i })
    .first()
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  return {
    dialog,
    errors,
    getSubmitted: () => submitted,
  };
}

async function fillContestBasics(page: Page, title: string) {
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Title$/i).fill(title);
  await dialog.getByRole('radio', { name: /^ACM$/ }).check();
  // ItemTimeRange stores gmtStart/gmtEnd; drive the range picker inputs directly.
  const range = dialog.locator('.ant-picker-range').first();
  await expect(range).toBeVisible();
  const inputs = range.locator('input');
  await inputs.nth(0).fill('2025-01-01 00:00:00');
  await inputs.nth(0).press('Enter');
  await inputs.nth(1).fill('2025-01-02 00:00:00');
  await inputs.nth(1).press('Enter');
  await dialog.locator('.ant-modal-title').click();
}

async function goStepNext(page: Page, dialog: ReturnType<Page['getByRole']>) {
  const next = dialog.getByRole('button', { name: /^(Next|下一步)$/ });
  if (await next.count()) {
    await next.first().click({ force: true });
    await page.waitForTimeout(200);
    return true;
  }
  return false;
}

test('contest management dialog rejects overflowing frozenTime and accepts a valid seal window', async ({
  page,
}) => {
  const { dialog, errors, getSubmitted } = await openContestCreateDialog(page);
  await fillContestBasics(page, 'Sealed Board Contest');
  await goStepNext(page, dialog);

  const frozen = dialog.getByLabel(/Frozen time/i);
  await expect(frozen).toBeVisible();
  await frozen.fill('2147483648');
  // Next on the management step must refuse the overflowing value.
  await dialog
    .getByRole('button', { name: /^(Next|下一步)$/ })
    .first()
    .click({ force: true });
  await page.waitForTimeout(200);
  await expect(frozen).toBeVisible();
  expect(getSubmitted()).toBeUndefined();

  await frozen.fill('30');
  await dialog
    .getByRole('button', { name: /^(Next|下一步)$/ })
    .first()
    .click({ force: true });
  await page.waitForTimeout(200);
  // Management step is left behind (form kept mounted but hidden).
  await expect(frozen).toBeHidden();
  await dialog
    .getByRole('button', { name: /^(Finish|Submit|完成|提交)$/ })
    .first()
    .click();
  await expect.poll(() => getSubmitted(), { timeout: 5000 }).toBeTruthy();
  expect(getSubmitted().features.frozenTime).toBe(30);
  await expectNoBrowserErrors(errors);
});

test('contest running-time submit switch is part of the management payload', async ({ page }) => {
  const { dialog, errors, getSubmitted } = await openContestCreateDialog(page);
  await fillContestBasics(page, 'Submit Gate Contest');
  await goStepNext(page, dialog);
  await expect(dialog.getByLabel(/Frozen time/i)).toBeVisible();

  // Table row order: contestRunning then contestEnd; each row has 5 switches
  // (peer, rank, score, checkpoint, allowToSubmit). Flip contestRunning.allowToSubmit off.
  const switches = dialog.locator('.ContestMFormManagementTable .ant-switch');
  await expect(switches).toHaveCount(10);
  await switches.nth(4).click();

  await dialog
    .getByRole('button', { name: /^(Next|下一步)$/ })
    .first()
    .click({ force: true });
  await page.waitForTimeout(200);
  await dialog
    .getByRole('button', { name: /^(Finish|Submit|完成|提交)$/ })
    .first()
    .click();
  await expect.poll(() => getSubmitted(), { timeout: 5000 }).toBeTruthy();
  expect(getSubmitted().features.contestRunning.allowToSubmit).toBe(0);
  expect(getSubmitted().features.contestEnd.allowToSubmit).toBe(1);
  await expectNoBrowserErrors(errors);
});
