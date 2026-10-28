import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/security',
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/security' }]],
  outputDir: 'test-results/security',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--no-proxy-server'] } },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], launchOptions: { args: ['--no-proxy-server'] } },
    },
  ],
  webServer: {
    command: 'node scripts/security-proxy.cjs',
    url: 'http://127.0.0.1:4173/__fixture/ready',
    reuseExistingServer: false,
    timeout: 45000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
  },
});
