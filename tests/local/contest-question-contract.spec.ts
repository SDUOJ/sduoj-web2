import { test, expect, APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

type Envelope<T> = { code: number; data: T; message?: string };
type Question = { contestClarificationId: string; title: string; isPublic: number };

async function call<T>(request: APIRequestContext, route: string, data?: unknown) {
  const response =
    data === undefined
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data });
  expect(response.ok(), route).toBe(true);
  const envelope = (await response.json()) as Envelope<T>;
  expect(envelope.code, `${route}: ${envelope.message ?? ''}`).toBe(0);
  return envelope;
}

test('real management visibility contract publishes, unpublishes and cleans up its own question', async ({
  request,
  baseURL,
}, testInfo) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const user = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  ) as { username: string; password: string };
  expect(user.username).toMatch(/^ai_dev_/);
  await call(request, '/user/login', { username: user.username, password: user.password });
  const profile = await call<{ roles: string[] }>(request, '/user/getProfile');
  expect(profile.data.roles).toContain('superadmin');
  const contests = await call<{ rows: Array<{ contestId: string }> }>(
    request,
    '/manage/contest/page?pageNow=1&pageSize=1',
  );
  expect(contests.data.rows).toHaveLength(1);
  const contestId = contests.data.rows[0].contestId;
  const listRoute = `/contest/listQuestion?contestId=${encodeURIComponent(contestId)}`;
  const before = (await call<Question[]>(request, listRoute)).data;
  const title = `FE-AUDIT-R35-${randomBytes(8).toString('hex')}`;
  let clarificationId: string | undefined;
  const observed: Array<{ opt: number; code: number; data: null }> = [];
  try {
    const created = await call<string>(request, '/contest/createQuestion', {
      contestId,
      title,
      message: 'Local-only contract regression; removed in finally.',
    });
    clarificationId = String(created.data);
    expect(clarificationId).toMatch(/^\d+$/);
    expect((await call<Question[]>(request, listRoute)).data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ contestClarificationId: clarificationId, title }),
      ]),
    );
    for (const opt of [1, 0]) {
      const response = await call<null>(request, '/manage/contest/publicIt', {
        clarificationId,
        opt,
      });
      expect(response.data).toBeNull();
      observed.push({ opt, code: response.code, data: response.data });
      expect((await call<Question[]>(request, listRoute)).data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ contestClarificationId: clarificationId, isPublic: opt }),
        ]),
      );
    }
  } finally {
    if (clarificationId) {
      const owned = (await call<Question[]>(request, listRoute)).data.find(
        (question) => question.contestClarificationId === clarificationId,
      );
      expect(owned?.title).toBe(title);
      await call(request, `/contest/delete?clarificationId=${encodeURIComponent(clarificationId)}`);
    }
    expect((await call<Question[]>(request, listRoute)).data).toEqual(before);
  }
  await testInfo.attach('visibility-contract', {
    contentType: 'application/json',
    body: JSON.stringify({ path: '/manage/contest/publicIt', observed, cleanup: 'verified' }),
  });
});
