import { test, expect } from '@playwright/test';

for (const route of [
  '/v2/manage/course/classroom?filter=a%26b#result',
  '/v2/problemSet/999999/overview?filter=a%26b#result',
]) {
  test(`real development authentication preserves the protected deep link: ${route}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(route);
    await expect(page).toHaveURL(/\/v2\/login\?to=/);
    expect(new URL(page.url()).searchParams.get('to')).toBe(route);
    expect(errors).toEqual([]);
  });
}

test('real development unknown routes render the shared 404', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/v2/not-a-route');
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
