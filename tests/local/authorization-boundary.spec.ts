import { test, expect, APIRequestContext, request as requestFactory } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

type Envelope = { code: number; data: unknown; message?: string };

test.use({ trace: 'off' });

async function login(request: APIRequestContext, username: string, password: string) {
  const response = await request.post('/api/user/login', { data: { username, password } });
  expect(response.ok(), `login ${username}: HTTP ${response.status()}`).toBe(true);
  const envelope = (await response.json()) as Envelope;
  expect(envelope.code, `login ${username}: ${envelope.message ?? ''}`).toBe(0);
}

async function readEnvelope(
  request: APIRequestContext,
  method: 'get' | 'post',
  route: string,
  data?: unknown,
) {
  const response =
    method === 'get'
      ? await request.get(`/api${route}`)
      : await request.post(`/api${route}`, { data });
  const envelope = (await response.json()) as Envelope;
  return { status: response.status(), ok: response.ok(), code: envelope.code };
}

test('non-admin sessions cannot read, write or delete management users', async ({
  baseURL,
}, testInfo) => {
  expect(['localhost', '127.0.0.1']).toContain(new URL(baseURL!).hostname);
  const admin = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '../../../sduoj-deploy/data/dev/ai-integration/test-user.json'),
      'utf8',
    ),
  ) as { username: string; password: string };
  expect(admin.username).toMatch(/^ai_dev_/);

  const adminContext = await requestFactory.newContext({ baseURL });
  const studentContext = await requestFactory.newContext({ baseURL });
  const suffix = randomBytes(4).toString('hex');
  const student = {
    username: `fe_auth_${suffix}`,
    password: `Fe1!${randomBytes(12).toString('hex')}`,
    email: `fe_auth_${suffix}@example.invalid`,
  };
  let created = false;

  try {
    await login(adminContext, admin.username, admin.password);
    const createResponse = await adminContext.post('/api/manage/user/addUsers', {
      data: [{ ...student, nickname: `FE-AUDIT-R25-${suffix}` }],
    });
    expect(createResponse.ok()).toBe(true);
    expect(((await createResponse.json()) as Envelope).code).toBe(0);
    created = true;

    await login(studentContext, student.username, student.password);
    const profileResponse = await studentContext.get('/api/user/getProfile');
    expect(profileResponse.ok()).toBe(true);
    const profile = (await profileResponse.json()) as {
      code: number;
      data: { username: string; roles: string[]; nickname: string };
    };
    expect(profile.code).toBe(0);
    expect(profile.data.username).toBe(student.username);
    expect(profile.data.roles).not.toEqual(expect.arrayContaining(['admin']));
    expect(profile.data.roles).not.toEqual(expect.arrayContaining(['superadmin']));
    const operations = [
      {
        name: 'read',
        result: await readEnvelope(studentContext, 'get', '/manage/user/list?pageNow=1&pageSize=1'),
      },
      {
        name: 'write',
        result: await readEnvelope(studentContext, 'post', '/manage/user/update', {
          username: student.username,
          nickname: `forbidden-${suffix}`,
        }),
      },
      {
        name: 'delete',
        result: await readEnvelope(studentContext, 'post', '/manage/user/delete', [
          student.username,
        ]),
      },
    ];

    for (const operation of operations) {
      expect(operation.result.status, operation.name).toBe(403);
      expect(operation.result.code, operation.name).toBe(403);
    }
    const unchangedProfile = await studentContext.get('/api/user/getProfile');
    expect(unchangedProfile.ok()).toBe(true);
    expect((await unchangedProfile.json()).data.nickname).toBe(`FE-AUDIT-R25-${suffix}`);
    console.log('R-25: read/write/delete HTTP 403; profile unchanged');
    await testInfo.attach('authorization-boundary', {
      contentType: 'application/json',
      body: JSON.stringify({
        principal: 'isolated non-admin account',
        operations: operations.map(({ name, result }) => ({ name, ...result })),
        cleanup: 'admin delete in finally',
      }),
    });
  } finally {
    if (created) {
      const cleanup = await adminContext.post('/api/manage/user/delete', {
        data: [student.username],
      });
      expect(cleanup.ok()).toBe(true);
      expect(((await cleanup.json()) as Envelope).code).toBe(0);
      const remaining = await adminContext.get('/api/manage/user/list', {
        params: { pageNow: 1, pageSize: 1, username: student.username },
      });
      expect(remaining.ok()).toBe(true);
      expect((await remaining.json()).data.rows).toEqual([]);
    }
    await studentContext.dispose();
    await adminContext.dispose();
  }
});
