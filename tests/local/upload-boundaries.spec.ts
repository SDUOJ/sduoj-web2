import { test, expect, APIRequestContext, request as requestFactory } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { ApiEnvelope, FileReference, JavaPage } from '../../src/Type/api';

test.use({ trace: 'off' });

async function json<Payload>(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.ok()).toBe(true);
  const envelope = (await response.json()) as ApiEnvelope<Payload>;
  expect(envelope.code).toBe(0);
  expect(envelope).toHaveProperty('data');
  return envelope.data!;
}

test('real filesys rejects missing parts and anonymous uploads and deduplicates repeated batch files', async ({
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
  await json(await request.post('/api/user/login', { data: user }));
  const templates = await json<JavaPage<{ zipFileId: string }>>(
    await request.get('/api/manage/judgetemplate/page?pageNow=1&pageSize=20&type=2'),
  );
  const fileId = templates.rows.find((row) => row.zipFileId)?.zipFileId;
  if (!fileId) throw new Error('No existing ZIP fixture is available; do not upload new content');
  let download = await request.get('/api/filesys/download', {
    params: { fileId, filename: 'fixture.zip' },
  });
  for (let retry = 0; retry < 2 && download.status() === 429; retry += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    download = await request.get('/api/filesys/download', {
      params: { fileId, filename: 'fixture.zip' },
    });
  }
  expect(download.ok()).toBe(true);
  const bytes = await download.body();
  expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304');
  const digest = createHash('md5').update(bytes).digest('hex');
  const before = await json<FileReference>(
    await request.get('/api/filesys/queryByMd5', { params: { md5: digest } }),
  );
  expect(before.id).toBe(fileId);

  const anonymous = await requestFactory.newContext({ baseURL });
  const missingPartResults: Array<{ endpoint: string; httpStatus: number; code: unknown }> = [];
  try {
    for (const endpoint of ['/filesys/upload', '/filesys/uploadFiles']) {
      const unauthorized = await anonymous.post(`/api${endpoint}`, {
        multipart: {
          [endpoint.endsWith('uploadFiles') ? 'files' : 'file']: {
            name: 'fixture.zip',
            mimeType: 'application/zip',
            buffer: bytes,
          },
        },
      });
      expect(unauthorized.status(), endpoint).toBe(401);
      expect((await unauthorized.json()).code, endpoint).toBe(401);
      const missing = await request.post(`/api${endpoint}`, { multipart: { unrelated: 'value' } });
      const missingEnvelope = (await missing.json()) as ApiEnvelope<unknown>;
      expect(missing.ok(), endpoint).toBe(false);
      expect(missingEnvelope.code, endpoint).not.toBe(0);
      missingPartResults.push({
        endpoint,
        httpStatus: missing.status(),
        code: missingEnvelope.code,
      });
    }

    const boundary = `r05-${randomUUID()}`;
    expect(bytes.includes(Buffer.from(boundary))).toBe(false);
    const part = (name: string) =>
      Buffer.concat([
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${name}"\r\nContent-Type: application/zip\r\n\r\n`,
        ),
        bytes,
        Buffer.from('\r\n'),
      ]);
    const batch = await json<FileReference[]>(
      await request.post('/api/filesys/uploadFiles', {
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        data: Buffer.concat([
          part('fixture-first.zip'),
          part('fixture-second.zip'),
          Buffer.from(`--${boundary}--\r\n`),
        ]),
      }),
    );
    expect(batch).toHaveLength(2);
    expect(batch.map((reference) => reference.id)).toEqual([before.id, before.id]);
    const after = await json<FileReference>(
      await request.get('/api/filesys/queryByMd5', { params: { md5: digest } }),
    );
    expect(after).toEqual(before);
    console.info(
      JSON.stringify({
        missingPartResults,
        anonymous: 'single/batch 401',
        batch: 'two existing IDs',
        metadataUnchanged: true,
      }),
    );
    await testInfo.attach('upload-contract', {
      contentType: 'application/json',
      body: JSON.stringify({
        timestampUtc: new Date().toISOString(),
        missingParts: missingPartResults,
        invalidInputStatus:
          'non-success only is verified; HTTP 5xx is a backend defect, not a passed 400 contract',
        anonymous: 'single/batch HTTP 401, business code 401',
        batch: 'two entries preserve the same existing ID',
        fileMetadata: 'unchanged before/after',
        fixturePolicy: 'existing ZIP only; no new file content or template saved',
        remaining: 'new-file cleanup, real cancellation/timeout, screen upload and attendance',
      }),
    });
  } finally {
    await anonymous.dispose();
  }
});
