import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './local',
  testMatch: 'ai-workspace.spec.ts',
  workers: 1,
  outputDir: '../output/ai-workspace-tests',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3012',
    launchOptions: { args: ['--no-proxy-server'] },
  },
});
