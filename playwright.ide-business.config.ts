import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';

const baseURL = process.env.IDE_BUSINESS_BASE;
const storageState = process.env.IDE_BUSINESS_STORAGE;
if (!baseURL || !storageState)
  throw new Error('IDE_BUSINESS_BASE and IDE_BUSINESS_STORAGE are required for real-service tests');
if (!fs.existsSync(storageState)) throw new Error('Private browser authentication file is missing');
if (fs.statSync(storageState).mode & 0o077)
  throw new Error('Browser authentication file must have private permissions (chmod 600)');
const proxy = process.env.IDE_BUSINESS_PROXY;
if (proxy && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(proxy).hostname))
  throw new Error('IDE_BUSINESS_PROXY must be a local test proxy');
if (!proxy && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname))
  throw new Error('A production-shaped origin requires the explicit local test proxy');

export default defineConfig({
  testDir: './tests/local',
  testMatch: 'ide-release-business.spec.ts',
  outputDir: process.env.IDE_BUSINESS_OUTPUT ?? './test-results/ide-business',
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: [
    ['list'],
    ['json', { outputFile: process.env.IDE_BUSINESS_REPORT ?? './test-results/ide-business.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    storageState,
    ...(proxy ? { proxy: { server: proxy } } : {}),
    // This standalone configuration targets the local TLS mirror of the production bundle.
    ignoreHTTPSErrors: true,
    trace: 'off', // Do not copy private cookies or request headers into trace artifacts.
    video: 'off',
    screenshot: 'only-on-failure',
  },
});
