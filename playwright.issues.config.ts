import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/local',
  testMatch:
    /(?:github-issues|ai-workspace|ai-locale|services|routes|api-response-contracts|vditor-assets)\.spec\.ts/,
  outputDir: './test-results/issues',
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/issues' }],
    ['json', { outputFile: 'playwright-report/issues/results.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.LOCAL_BASE_URL ?? 'http://127.0.0.1:3001',
    launchOptions: { args: ['--no-proxy-server'] },
    trace: 'off',
    screenshot: 'only-on-failure',
  },
});
