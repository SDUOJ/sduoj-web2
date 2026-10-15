import { expect, test } from '@playwright/test';

/** Keep the existing WebKit layout-notification budget separate from application errors. */
export async function expectNoBrowserErrors(errors: string[]) {
  const info = test.info();
  const notification = 'ResizeObserver loop completed with undelivered notifications.';
  const layout: string[] =
    info.project.name === 'webkit' ? errors.filter((error) => error === notification) : [];
  const unexpected = errors.filter((error) => !layout.includes(error));
  await info.attach('browser-error-budget', {
    contentType: 'application/json',
    body: JSON.stringify({ allowedResizeObserverNotifications: layout.length, unexpected }),
  });
  expect(layout.length).toBeLessThanOrEqual(2);
  expect(unexpected).toEqual([]);
}
