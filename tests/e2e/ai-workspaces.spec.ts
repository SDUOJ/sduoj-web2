import { expectBrowserErrorBudget } from '../helpers/browserErrorBudget';
import { test, expect, Page } from '@playwright/test';
import type { ProviderSettings, StorageAudit } from '../../src/Utils/API/ai-platform';

const settings: ProviderSettings = {
  provider: 'fixture',
  model: 'fixture',
  base_url: '',
  reasoning_effort: 'low',
  input_usd_per_million: 0,
  cached_usd_per_million: 0,
  output_usd_per_million: 0,
  max_task_cost_usd: 1,
  max_concurrency: 1,
  per_user_concurrency: 1,
  max_queued_per_user: 1,
  agent_concurrency: 1,
  sandbox_concurrency: 1,
  document_concurrency: 1,
  max_output_tokens: 100,
  max_prompt_bytes: 1000,
  monthly_user_budget_usd: 1,
  monthly_course_budget_usd: 1,
  timeout_seconds: 10,
  max_storage_mb: 1,
  model_overrides: {},
  version: 1,
  has_api_key: false,
};
const storage: StorageAudit = {
  read_only: true,
  scanned_at: '2026-10-26T00:00:00Z',
  minimum_age_seconds: 3600,
  disk_file_count: 0,
  registered_file_count: 0,
  orphan_file_count: 0,
  orphan_bytes: 0,
  eligible_orphan_file_count: 0,
  eligible_orphan_bytes: 0,
  missing_file_count: 0,
  metadata_mismatch_count: 0,
  special_entry_count: 0,
  invalid_database_path_count: 0,
  orphans: [],
  missing_files: [],
  metadata_mismatches: [],
  special_entries: [],
  invalid_database_paths: [],
  results_truncated: false,
};

const AI_ROUTES = [
  '/v2/ai-workbench',
  '/v2/ai-bank',
  '/v2/ai-authoring',
  '/v2/ai-grading',
  '/v2/ai-exams',
  '/v2/ai-course',
  '/v2/ai-plagiarism',
  '/v2/ai-interviews',
  '/v2/ai-admin',
];

async function openAiPage(page: Page, path: string) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  const errors: string[] = [];
  const pending = new Set<Promise<void>>();
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const p = new URL(route.request().url()).pathname.replace(/^\/api/, '');
    let data: unknown = { rows: [], totalNum: 0, totalPage: 0, items: [], jobs: [] };
    if (p === '/user/getProfile') {
      data = { username: 'test_admin', roles: ['admin', 'superadmin'], features: {} };
    } else if (p === '/site/getCopyright') {
      data = 'SDUOJ';
    } else if (p === '/ps/management-agent/sessions' || p === '/ps/management-agent/presets') {
      // These endpoints return bare arrays, not paginated table responses.
      data = [];
    } else if (p === '/ps/auto-task/ai/account') {
      data = { status: 'active' };
    } else if (p === '/ps/auto-task/ai/capabilities') {
      data = { admin: true, sandbox_enabled: false };
    } else if (p === '/ps/auto-task/ai/points/ledger' || p === '/ps/auto-task/ai/reviews') {
      data = [];
    } else if (p === '/ps/auto-task/ai/settings') {
      data = settings;
    } else if (p === '/ps/auto-task/ai/admin/queue') {
      data = { counts: {}, cost_usd: '0', settings };
    } else if (p === '/ps/auto-task/ai/admin/storage/orphans') {
      data = storage;
    } else if (p.startsWith('/ai/')) {
      data = { rows: [], items: [], jobs: [], total: 0, enabled: true, settings: {} };
    } else {
      data = { rows: [], totalNum: 0, totalPage: 0 };
    }
    const reply = route.fulfill({
      headers: {
        'access-control-allow-origin': 'http://127.0.0.1:4173',
        'access-control-allow-credentials': 'true',
      },
      json: { code: 0, data, message: '', timestamp: Date.now() },
    });
    pending.add(reply);
    try {
      await reply;
    } finally {
      pending.delete(reply);
    }
  });
  await page.goto(path);
  await expect(page.getByRole('main').getByRole('button').first()).toBeVisible();
  // Flush requests started during mount before looking for render errors.
  while (pending.size) await Promise.all([...pending]);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(
    page.getByRole('heading', { name: 'Something went wrong', exact: true }),
  ).toHaveCount(0);
  return { errors };
}

// A fresh Playwright page/context per route prevents pending requests and route handlers
// from a previous SPA document being attributed to the next workspace in WebKit.
for (const route of AI_ROUTES) {
  test(`AI workspace ${route} mounts without runtime errors`, async ({
    page,
    browserName,
  }, testInfo) => {
    const { errors } = await openAiPage(page, route);
    await expect(page.getByRole('main').getByRole('button').first()).toBeVisible();
    await expectBrowserErrorBudget(errors, browserName, testInfo);
  });
}

test('AI admin settings page exposes configuration controls', async ({
  page,
  browserName,
}, testInfo) => {
  const { errors } = await openAiPage(page, '/v2/ai-admin');
  await expect(page.getByRole('main').getByRole('button').first()).toBeVisible();
  await expectBrowserErrorBudget(errors, browserName, testInfo);
});
