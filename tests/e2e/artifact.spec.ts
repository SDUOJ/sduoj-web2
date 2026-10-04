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
