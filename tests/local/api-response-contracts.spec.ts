import { test, expect, APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  ApiEnvelope,
  AutoLabPage,
  ContestListRow,
  FileReference,
  JavaPage,
  ProblemSetInfo,
  ProblemSetListRow,
} from '../../src/Type/api';
import { UserInfo } from '../../src/Type/Iuser';
import { PlatformJob, PlatformResource } from '../../src/Utils/API/ai-platform';

test.use({ trace: 'off' });

async function read<Payload>(
  request: APIRequestContext,
  route: string,
  data?: unknown,
): Promise<Payload> {
  const response =
    data === undefined
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data });
  expect(response.ok(), route).toBe(true);
  const envelope = (await response.json()) as ApiEnvelope<Payload>;
  expect(envelope.code, route).toBe(0);
  expect(envelope).toHaveProperty('data');
  return envelope.data!;
}

test('real local API responses keep Java strings, AutoLab numbers, nullable files, and AI scopes', async ({
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
  const loggedIn = await read<UserInfo>(request, '/user/login', {
    username: user.username,
    password: user.password,
  });
  const profile = await read<UserInfo>(request, '/user/getProfile');
  expect(profile.userId).toBe(loggedIn.userId);
  expect(typeof profile.userId).toBe('string');
  expect(profile.features).toMatchObject({ requirePasswordChange: expect.any(Number) });
  expect(profile).not.toHaveProperty('password');
  const contests = await read<JavaPage<ContestListRow>>(
    request,
    '/contest/list?pageNow=1&pageSize=1',
  );
  for (const key of ['totalNum', 'totalPage', 'pageSize', 'pageIndex'] as const)
    expect(typeof contests[key]).toBe('string');
  expect(typeof contests.rows[0].contestId).toBe('string');
  const sets = await read<AutoLabPage<ProblemSetListRow>>(request, '/ps/problem_set/list', {
    pageNow: 1,
    pageSize: 30,
  });
  for (const key of ['totalNum', 'pageSize', 'pageIndex'] as const)
    expect(typeof sets[key]).toBe('number');
  const owned = sets.rows.find(
    (row) => row.username === user.username && row.name.startsWith('FE-DEV-'),
  );
  expect(owned).toBeTruthy();
  const info = await read<ProblemSetInfo>(request, '/ps/problem_set/info_c', { psid: owned!.psid });
  expect(typeof info.psid).toBe('number');
  expect(info.isAdmin).toBe(true);
  expect(info.groupInfo[0].problemInfo[0]).toMatchObject({
    index: 0,
    collect: expect.any(Number),
    hasAnswer: expect.any(Boolean),
  });
  await expect(
    read<FileReference | null>(request, '/filesys/queryByMd5?md5=00000000000000000000000000000000'),
  ).resolves.toBeNull();
  const resources = await read<AutoLabPage<PlatformResource>>(
    request,
    '/ps/auto-task/ai/resources/list',
    { pageNow: 1, pageSize: 1 },
  );
  expect(typeof resources.totalNum).toBe('number');
  const resource = resources.rows[0];
  expect(resource).toMatchObject({ id: expect.any(String), version: expect.any(Number) });
  for (const key of ['course_id', 'psid'] as const)
    expect(resource[key] === null || typeof resource[key] === 'number').toBe(true);
  const jobs = await read<{ rows: PlatformJob[]; totalNum: number }>(
    request,
    '/ps/auto-task/ai/jobs/list',
    { pageNow: 1, pageSize: 1 },
  );
  const job = await read<PlatformJob>(request, `/ps/auto-task/ai/jobs/${jobs.rows[0].id}`);
  expect(job).toMatchObject({
    id: expect.any(String),
    attempt: expect.any(Number),
    next_cursor: expect.any(Number),
    events: expect.any(Array),
  });
  expect(job.error === null || typeof job.error === 'string').toBe(true);
  await testInfo.attach('response-contracts', {
    contentType: 'application/json',
    body: JSON.stringify({
      javaPage: 'string counters',
      autolabPage: 'number counters',
      profile: 'no credentials',
      missingFile: 'null',
      aiScopes: 'nullable',
      jobEvents: 'cursor and array',
      explicitMutations:
        'login only; info_c can lazily initialize server-side progress for the existing fixture',
    }),
  });
});
