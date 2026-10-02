import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './local',
  testMatch: 'ai-question-workflows.spec.ts',
  workers: 1,
  outputDir: '../output/ai-question-workflow-tests',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3012',
    launchOptions: { args: ['--no-proxy-server'] },
    screenshot: 'only-on-failure',
  },
});
