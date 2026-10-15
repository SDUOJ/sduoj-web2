import { test, expect, Page } from '@playwright/test';

async function openSubmissionList(page: Page) {
  await page.addInitScript(() => localStorage.setItem('language', 'zh'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const p = url.pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0 };
    if (p === '/user/getProfile') data = { username: 'fe_admin', roles: ['admin'], features: {} };
    else if (p === '/site/getCopyright') data = 'SDUOJ';
    else if (p === '/submit/queryACProblem') data = [];
    else if (p === '/submit/list') {
      data = {
        rows: [
          {
            submissionId: 'c46836f354db011',
            username: 'fe_94',
            problemCode: 'SDUOJ-1',
            problemTitle: 'demo',
            judgeResult: 0,
            gmtCreate: String(Date.now()),
            judgeTemplateTitle: 'io',
          },
        ],
        totalNum: 1,
        totalPage: 1,
      };
    } else {
      data = { rows: [], totalNum: 0, totalPage: 0 };
    }
    await route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, timestamp: Date.now() },
    });
  });
  await page.goto('/v2/submission');
  await page.waitForSelector('.ant-table-thead');
  return { errors };
}

test('unified table card keeps its head free of the stray top divider', async ({ page }) => {
  const { errors } = await openSubmissionList(page);
  const card = page.locator('.unified-table-card').first();
  await expect(card).toBeVisible();

  const headBorder = await card.evaluate((el) => {
    const head = el.querySelector('.ant-card-head');
    return head ? getComputedStyle(head).borderBottomWidth : 'no-head';
  });
  // Either the card has no head, or the head divider is fully removed.
  expect(headBorder === 'no-head' || headBorder === '0px').toBe(true);

  // Thead must not grow an extra top border either.
  const theadBorder = await page
    .locator('.ant-table-thead')
    .first()
    .evaluate((el) => {
      return getComputedStyle(el).borderTopWidth;
    });
  expect(theadBorder).toBe('0px');

  expect(errors).toEqual([]);
});
