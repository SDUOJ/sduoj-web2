import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/local',
  testMatch: /(?:r12-browser-regression|routes|services)\.spec\.ts/,
  outputDir: 'test-results/r12',
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/r12' }]],
  use: {
    baseURL: process.env.LOCAL_BASE_URL ?? 'http://localhost:3001',
    launchOptions: { args: ['--no-proxy-server'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
