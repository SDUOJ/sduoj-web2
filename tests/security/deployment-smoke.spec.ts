import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';

test('deployment smoke verifies the actual nginx artifact, headers, fallback and API boundary', async ({}, testInfo) => {
  test.setTimeout(90000);
  const environment = { ...process.env };
  delete environment.FORCE_COLOR;
  const result = await new Promise<{ status: number | null; output: string; error: string }>(
    (resolve) => {
      const child = spawn(
        process.execPath,
        [
          'scripts/deployment-smoke.cjs',
          'http://127.0.0.1:4173/v2/',
          '--loopback-audit',
          '--expected-manifest',
          'build-test/release-manifest.json',
        ],
        { timeout: 80000, env: environment },
      );
      let output = '';
      let error = '';
      child.stdout.on('data', (chunk) => {
        output += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        error += chunk.toString();
      });
      child.on('error', (failure) => {
        error += failure.message;
      });
      child.on('close', (status) => resolve({ status, output, error }));
    },
  );
  await testInfo.attach('deployment-smoke', {
    contentType: 'application/json',
    body: result.output,
  });
  expect(result.error).toBe('');
  expect(result.status, result.output).toBe(0);
  const report = JSON.parse(result.output);
  expect(report.status).toBe('verified');
  expect(report.fileCount).toBeGreaterThan(700);
  expect(report.requests).toHaveLength(report.fileCount + 6);
  expect(report.requests.some((request: { path: string }) => request.path === '/v2/login')).toBe(
    true,
  );
});
