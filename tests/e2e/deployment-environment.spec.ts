import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test('a real production artifact on another origin refuses startup without API or WebSocket access', async ({
  page,
}) => {
  const external: string[] = [];
  const sockets: string[] = [];
  const root = path.resolve(__dirname, '../../build');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json'), 'utf8'));
  expect(manifest.deployment.environment).toBe('production');
  page.on('websocket', (socket) => sockets.push(socket.url()));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1:4174' || url.pathname.startsWith('/api/')) {
      external.push(url.origin + url.pathname);
      return route.abort();
    }
    const relative = decodeURIComponent(url.pathname.replace(/^\/v2\//, ''));
    let file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) return route.fulfill({ status: 403 });
    if (!path.extname(file)) file = path.join(root, 'index.html');
    if (!fs.existsSync(file)) return route.fulfill({ status: 404 });
    return route.fulfill({ path: file });
  });
  await page.goto('http://127.0.0.1:4174/v2/login');
  await expect(page.getByRole('alert')).toContainText('Deployment configuration mismatch');
  expect(external).toEqual([]);
  expect(sockets).toEqual([]);
});

test('the isolated test build sends API requests only to its declared environment', async ({
  page,
}) => {
  const apiOrigins: string[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    apiOrigins.push(url.origin);
    if (url.pathname === '/api/user/getProfile') {
      await route.fulfill({
        status: 401,
        json: { code: 401, message: 'Unauthenticated', data: null },
      });
    } else {
      await route.fulfill({ json: { code: 0, data: 'SDUOJ' } });
    }
  });
  await page.goto('/v2/login');
  await page.getByRole('tab', { name: 'Account & Password' }).click();
  await expect(page.locator('input[type="password"]').first()).toBeVisible();
  expect(apiOrigins.length).toBeGreaterThan(0);
  expect(new Set(apiOrigins)).toEqual(new Set(['http://127.0.0.1:4173']));
});
