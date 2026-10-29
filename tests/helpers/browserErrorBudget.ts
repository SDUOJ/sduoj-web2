import { expect, TestInfo } from '@playwright/test';

/**
 * Existing WebKit compatibility contract, also reproduced on the a488630 baseline.
 * Do not suppress page errors: retain every notification in the test attachment.
 */
export async function expectBrowserErrorBudget(
  errors: string[],
  browserName: string,
  testInfo: TestInfo,
) {
  const resizeNotification = 'ResizeObserver loop completed with undelivered notifications.';
  const allowed =
    browserName === 'webkit' ? errors.filter((error) => error === resizeNotification) : [];
  const unexpected = errors.filter(
    (error) => browserName !== 'webkit' || error !== resizeNotification,
  );
  await testInfo.attach('browser-error-budget', {
    contentType: 'application/json',
    body: JSON.stringify({ allowedResizeObserverNotifications: allowed.length, unexpected }),
  });
  expect(allowed.length).toBeLessThanOrEqual(2);
  expect(unexpected).toEqual([]);
}
