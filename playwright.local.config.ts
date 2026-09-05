import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/local',
  outputDir: './test-results/local',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/local' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.LOCAL_BASE_URL ?? 'http://localhost:3000',
    launchOptions: { args: ['--no-proxy-server'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
