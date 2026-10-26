import { defineConfig, devices } from '@playwright/test';

const proxy = process.env.IDE_LIVE_PROXY;
if (proxy && !['127.0.0.1', 'localhost'].includes(new URL(proxy).hostname))
  throw new Error('IDE_LIVE_PROXY must be a local test proxy');
if (
  !proxy &&
  !['127.0.0.1', 'localhost'].includes(
    new URL(process.env.IDE_LIVE_BASE ?? 'http://127.0.0.1:3002').hostname,
  )
)
  throw new Error('A production-shaped origin requires the explicit local test proxy');

export default defineConfig({
  testDir: './tests/local',
  testMatch: 'ide-worker-live.spec.ts',
  outputDir: process.env.IDE_LIVE_OUTPUT ?? './test-results/ide-live',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.IDE_LIVE_REPORT ?? './test-results/ide-live.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.IDE_LIVE_BASE ?? 'http://127.0.0.1:3002',
    ...(process.env.IDE_LIVE_PROXY
      ? { proxy: { server: process.env.IDE_LIVE_PROXY }, ignoreHTTPSErrors: true }
      : { launchOptions: { args: ['--no-proxy-server'] } }),
    storageState: process.env.IDE_LIVE_STORAGE,
    trace: 'off', // Authenticated real-service artifacts must not copy cookies or passwords.
    screenshot: 'only-on-failure',
  },
});
