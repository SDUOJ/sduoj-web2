import { test, expect } from '@playwright/test';

test('frontend proxy reaches the local Java gateway and Autolab', async ({ request }) => {
  const site = await request.get('/api/site/getCopyright');
  expect(site.ok()).toBe(true);
  expect((await site.json()).data).toBe('SDUOJ local development');
  const proxied = await request.get('/api/ps/openapi.json');
  const direct = await request.get('http://127.0.0.1:5005/openapi.json');
  expect(proxied.ok()).toBe(true);
  expect(direct.ok()).toBe(true);
  expect(Object.keys((await proxied.json()).paths).sort()).toEqual(
    Object.keys((await direct.json()).paths).sort(),
  );
});

test('problem browsing uses real local services without external requests', async ({ page }) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      external.push(url.origin);
      return route.abort();
    }
    await route.continue();
  });
  await page.goto('/v2/problem');
  await expect(page.getByText('SDUOJ local development', { exact: true })).toBeVisible();
  await expect(page.locator('.ant-table-row').first()).toBeVisible();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
