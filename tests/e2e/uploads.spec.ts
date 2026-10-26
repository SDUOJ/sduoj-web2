import { expect, Page, Route, test } from '@playwright/test';

const problem = {
  problemId: 1,
  problemCode: 'ZIP-1',
  problemTitle: 'ZIP upload fixture',
  timeLimit: 1000,
  memoryLimit: 262144,
  source: 'Playwright',
  isAccepted: 0,
  judgeTemplates: [
    { id: 'zip', title: 'ZIP', type: 0, comment: '', acceptFileExtensions: ['zip'] },
  ],
  functionTemplates: [],
  problemCaseDTOList: [],
  problemDescriptionDTO: { id: 1, markdownDescription: 'Upload a ZIP solution.' },
  problemDescriptionListDTOList: [{ id: 1, title: 'Default', voteNum: 0 }],
};

async function installFixtures(
  page: Page,
  upload: (route: Route) => Promise<void>,
  onSubmit: (body: unknown) => void = () => {},
) {
  await page.addInitScript(() => {
    localStorage.setItem('language', 'en');
    localStorage.setItem('SDUOJ-Last-Submit-JT', 'zip');
  });
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown;
    switch (pathname) {
      case '/user/getProfile':
        data = { username: 'upload-user', roles: ['user'], features: {} };
        break;
      case '/site/getCopyright':
        data = 'SDUOJ';
        break;
      case '/submit/queryACProblem':
        data = [];
        break;
      case '/run/capabilities':
        data = { enabled: true, maxCases: 10 };
        break;
      case '/problem/query':
        data = problem;
        break;
      case '/submit/list':
        data = { rows: [], totalNum: 0, totalPage: 0 };
        break;
      case '/filesys/upload':
        await upload(route);
        return;
      case '/submit/create':
        onSubmit(route.request().postDataJSON());
        data = 'zip-submission';
        break;
      case '/submit/query':
        data = { submissionId: 'zip-submission', judgeResult: 0, judgeScore: 0 };
        break;
      default:
        throw new Error(`Missing upload fixture: ${route.request().method()} ${pathname}`);
    }
    await route.fulfill({ json: { code: 0, data, timestamp: Date.now() } });
  });
}

async function openZipSubmit(page: Page) {
  await page.goto('/v2/problem/ZIP-1');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('ZIP upload fixture')).toBeVisible();
  return dialog;
}

test('ZIP upload failure blocks submission and a successful retry supplies the file id', async ({
  page,
}) => {
  let uploadAttempt = 0;
  let submitted: unknown;
  await installFixtures(
    page,
    async (route) => {
      uploadAttempt += 1;
      if (uploadAttempt === 1) {
        await route.fulfill({
          status: 503,
          json: { code: 503, message: 'offline', timestamp: Date.now() },
        });
        return;
      }
      await route.fulfill({
        json: { code: 0, data: { id: 'zip-file' }, timestamp: Date.now() },
      });
    },
    (body) => {
      submitted = body;
    },
  );
  const dialog = await openZipSubmit(page);
  const submit = dialog.getByRole('button', { name: 'Submit', exact: true });

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'failed.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('failed'),
  });
  await expect(page.locator('.ant-message-error').last()).toBeVisible();
  await expect(submit).toBeDisabled();
  expect(submitted).toBeUndefined();

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'retry.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('retry'),
  });
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect
    .poll(() => submitted)
    .toMatchObject({
      judgeTemplateId: 'zip',
      zipFileId: 'zip-file',
    });
});

test('closing the submit form cancels a pending ZIP upload and discards its late result', async ({
  page,
}) => {
  let releaseUpload!: () => void;
  const uploadRelease = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  let uploadStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    uploadStarted = resolve;
  });
  await installFixtures(page, async (route) => {
    uploadStarted();
    await uploadRelease;
    await route
      .fulfill({ json: { code: 0, data: { id: 'late-file' }, timestamp: Date.now() } })
      .catch(() => {});
  });
  const dialog = await openZipSubmit(page);
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'pending.zip',
    mimeType: 'application/zip',
    buffer: Buffer.from('pending'),
  });
  await started;
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  releaseUpload();

  const reopened = await openZipSubmit(page);
  await expect(reopened.getByRole('button', { name: 'Submit', exact: true })).toBeDisabled();
  await expect(reopened.getByText('pending.zip')).toHaveCount(0);
});
