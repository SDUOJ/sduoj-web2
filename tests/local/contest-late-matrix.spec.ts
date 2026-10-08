import { test, expect, APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Envelope<T> = { code: number; data: T; message?: string };

async function call<T>(
  request: APIRequestContext,
  route: string,
  data?: unknown,
  method: 'GET' | 'POST' = data === undefined ? 'GET' : 'POST',
) {
  const response =
    method === 'GET'
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data: data ?? {} });
  const envelope = (await response.json()) as Envelope<T>;
  return { status: response.status(), envelope };
}

function loadUser() {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  ) as { username: string; password: string };
}

test('real contest register and submission permission matrix', async ({ request, baseURL }) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const user = loadUser();
  expect(user.username).toMatch(/^ai_dev_/);
  const login = await call(request, '/user/login', {
    username: user.username,
    password: user.password,
  });
  expect(login.envelope.code).toBe(0);

  const page = await call<{ rows: Array<{ contestId: string; features: any }> }>(
    request,
    '/manage/contest/page?pageNow=1&pageSize=5',
  );
  expect(page.envelope.code).toBe(0);
  expect(page.envelope.data.rows.length).toBeGreaterThan(0);
  const contestId = page.envelope.data.rows[0].contestId;

  const info = await call<any>(request, `/contest/query?contestId=${contestId}`);
  expect(info.envelope.code).toBe(0);
  const features = info.envelope.data.features;
  expect(features).toMatchObject({
    mode: expect.any(String),
    openness: expect.stringMatching(/public|protected|private/),
    frozenTime: expect.any(Number),
    contestRunning: expect.objectContaining({ allowToSubmit: expect.any(Number) }),
    contestEnd: expect.objectContaining({ allowToSubmit: expect.any(Number) }),
  });
  expect(features.frozenTime).toBeGreaterThanOrEqual(-2147483648);
  expect(features.frozenTime).toBeLessThanOrEqual(2147483647);

  // Rank feed must stay well-formed even when empty.
  const rank = await call<any[]>(request, `/contest/rank?contestId=${contestId}`);
  expect(rank.envelope.code).toBe(0);
  expect(Array.isArray(rank.envelope.data)).toBe(true);

  // Registration is either already done or returns a domain error — never a crash.
  const participate = await call(request, '/contest/participate', { contestId });
  expect([0, 400, 403]).toContain(participate.envelope.code);

  // Feature validation rejects overflowing frozenTime on the manage endpoint.
  const overflow = await call(request, '/manage/contest/create', {
    contestTitle: 'FE-AUDIT-FROZEN-OVERFLOW',
    isPublic: 0,
    gmtStart: Date.now() + 3600_000,
    gmtEnd: Date.now() + 7200_000,
    features: {
      mode: 'acm',
      openness: 'public',
      frozenTime: 2147483648,
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
    problems: [],
    participants: [],
  });
  expect(overflow.envelope.code).not.toBe(0);
});

test('real late-permission CRUD with discount boundary matrix', async ({ request, baseURL }) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const user = loadUser();
  const login = await call(request, '/user/login', {
    username: user.username,
    password: user.password,
  });
  expect(login.envelope.code).toBe(0);

  // Discover a problem set that already has late-permission storage (psid=1 in dev).
  const list = await call<{ rows: any[]; totalNum: number }>(request, '/ps/problem_set/late/list', {
    psid: 1,
    page: { pageSize: 5, pageNow: 1 },
  });
  expect(list.envelope.code).toBe(0);
  expect(Array.isArray(list.envelope.data.rows)).toBe(true);

  const expire = Date.now() + 24 * 3600_000;
  const created = await call<any>(request, '/ps/problem_set/late/add', {
    psid: 1,
    username: user.username,
    expire_time: expire,
    discount: 0.01,
    note: 'FE-AUDIT late matrix',
  });
  expect(created.envelope.code, created.envelope.message).toBe(0);
  // Response may be null body; re-list to find the created row.
  const after = await call<{ rows: any[] }>(request, '/ps/problem_set/late/list', {
    psid: 1,
    page: { pageSize: 20, pageNow: 1 },
    username: user.username,
  });
  expect(after.envelope.code).toBe(0);
  const row = after.envelope.data.rows.find((item) => item.username === user.username);
  expect(row).toBeTruthy();
  expect(row.discount).toBeCloseTo(0.01, 5);

  // Discount bounds: 0 exclusive-min rejected, 1 accepted, >1 rejected.
  const zero = await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    discount: 0,
  });
  expect(zero.envelope.code).not.toBe(0);

  const one = await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    discount: 1,
  });
  expect(one.envelope.code, one.envelope.message).toBe(0);

  const over = await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    discount: 1.2,
  });
  expect(over.envelope.code).not.toBe(0);

  // Disable then re-enable the permission.
  const disable = await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    is_active: false,
  });
  expect(disable.envelope.code, disable.envelope.message).toBe(0);
  const enable = await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    is_active: true,
  });
  expect(enable.envelope.code, enable.envelope.message).toBe(0);

  // Best-effort cleanup via disable so the fixture stays inert.
  await call(request, '/ps/problem_set/late/update', {
    psid: 1,
    id: row.id,
    is_active: false,
    note: 'FE-AUDIT late matrix cleaned',
  });
});
