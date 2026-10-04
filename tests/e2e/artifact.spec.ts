import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

test('served release metadata and entrypoint hashes match the tested checkout', async ({
  request,
}) => {
  const response = await request.get('/v2/release-manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.schemaVersion).toBe(1);
  expect(manifest.publicPath).toBe('/v2/');
  expect(manifest.sourceRef).toBe(
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  );
  const assetResponse = await request.get('/v2/asset-manifest.json');
  expect(assetResponse.ok()).toBe(true);
  const assets = await assetResponse.json();
  for (const filename of ['index.html', ...assets.entrypoints]) {
    const file = manifest.files.find((entry: { path: string }) => entry.path === filename);
    expect(file, filename).toBeDefined();
    const resource = await request.get(`/v2/${filename}`);
    expect(resource.ok(), filename).toBe(true);
    const body = await resource.body();
    expect(body.length, filename).toBe(file.size);
    expect(createHash('sha256').update(body).digest('hex'), filename).toBe(file.sha256);
  }
});

test('Vditor runtime, emoji and themes use one content-addressed resource namespace', async ({
  request,
}) => {
  const response = await request.get('/v2/release-manifest.json');
  const manifest = await response.json();
  const files: Array<{ path: string; size: number; sha256: string }> = manifest.files.filter(
    (entry: { path: string }) => entry.path.startsWith('vditor/'),
  );
  const prefixes = new Set(files.map((file) => file.path.split('/').slice(0, 3).join('/')));
  expect(prefixes.size).toBe(1);
  const prefix = [...prefixes][0];
  expect(prefix).toMatch(/^vditor\/[a-f0-9]{64}\/dist$/);
  const resources = [
    files.find((file) => file.path === `${prefix}/index.min.js`),
    files.find((file) => file.path.endsWith('/js/lute/lute.min.js')),
    files.find((file) => file.path.includes('/images/emoji/')),
    files.find((file) => file.path.includes('/css/content-theme/')),
  ];
  for (const file of resources) {
    expect(file).toBeDefined();
    if (!file) throw new Error('Missing Vditor fixture');
    const resource = await request.get(`/v2/${file.path}`);
    expect(resource.ok()).toBe(true);
    const bytes = await resource.body();
    expect(bytes.length).toBe(file.size);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(file.sha256);
  }
  expect((await request.get('/v2/vditor/dist/index.min.js')).status()).toBe(404);
});
