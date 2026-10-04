import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AIAdmin from './AIAdmin';
import { aiPlatform } from '../../../Utils/API/ai-platform';
import i18n from '../../../Config/i18n';

jest.mock('../../../Utils/API/ai-platform', () => ({
  aiPlatform: {
    account: jest.fn(),
    capabilities: jest.fn(),
    ledger: jest.fn(),
    settings: jest.fn(),
    reviews: jest.fn(),
    unsettled: jest.fn(),
    queue: jest.fn(),
    storageAudit: jest.fn(),
    cleanupOrphans: jest.fn(),
    health: jest.fn(),
    saveSettings: jest.fn(),
    adjust: jest.fn(),
    review: jest.fn(),
    reconcile: jest.fn(),
  },
}));

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  jest.clearAllMocks();
  (aiPlatform.account as jest.Mock).mockResolvedValue({
    subject_id: '42',
    status: 'active',
    balance: '10',
  });
  (aiPlatform.capabilities as jest.Mock).mockResolvedValue({ admin: true, sandbox_enabled: true });
  (aiPlatform.ledger as jest.Mock).mockResolvedValue([]);
  (aiPlatform.settings as jest.Mock).mockResolvedValue({
    provider: 'codex',
    model: 'test',
    base_url: 'https://example.test',
    reasoning_effort: 'medium',
    input_usd_per_million: 1,
    cached_usd_per_million: 1,
    output_usd_per_million: 1,
    max_task_cost_usd: 2,
    max_concurrency: 2,
    per_user_concurrency: 1,
    max_queued_per_user: 100,
    agent_concurrency: 2,
    sandbox_concurrency: 1,
    document_concurrency: 1,
    max_output_tokens: 1024,
    max_prompt_bytes: 1000,
    monthly_user_budget_usd: 0,
    monthly_course_budget_usd: 0,
    timeout_seconds: 60,
    max_storage_mb: 512,
    model_overrides: {},
    version: 1,
    has_api_key: true,
  });
  (aiPlatform.reviews as jest.Mock).mockResolvedValue([]);
  (aiPlatform.unsettled as jest.Mock).mockResolvedValue({ rows: [], totalNum: 0 });
  (aiPlatform.queue as jest.Mock).mockResolvedValue({
    counts: { pending: 0 },
    cost_usd: '0',
    settings: {},
  });
  (aiPlatform.storageAudit as jest.Mock).mockResolvedValue({
    read_only: true,
    scanned_at: '2026-09-06T00:00:00Z',
    minimum_age_seconds: 86400,
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
  });
});

afterEach(async () => {
  await i18n.changeLanguage('zh');
});

test('renders empty admin panes and keeps key write-only', async () => {
  render(
    <MemoryRouter>
      <AIAdmin />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: '账户与管理' })).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole('tab', { name: '内容复核' }));
  expect(screen.getByText('暂无复核记录')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '待对账' }));
  expect(screen.getByText('暂无未知用量')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '模型' }));
  expect(screen.getByLabelText('API Key（已配置）')).toHaveValue('');
  expect(screen.queryByDisplayValue('test-secret')).not.toBeInTheDocument();
});

test('dry-run preview is read-only and cleanup requires an explicit reason', async () => {
  (aiPlatform.cleanupOrphans as jest.Mock).mockResolvedValue({
    applied: false,
    planned_file_count: 1,
    planned_bytes: 12,
    planned_files: [{ path: 'uploads/orphan.txt', size: 12 }],
    deleted_file_count: 0,
    deleted_bytes: 0,
    deleted_files: [],
    skipped_files: [],
    remaining_eligible_file_count: 1,
    audit: {},
  });
  render(
    <MemoryRouter>
      <AIAdmin />
    </MemoryRouter>,
  );
  await waitFor(() => expect(screen.getByText('队列与存储')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('tab', { name: '队列与存储' }));
  fireEvent.click(screen.getByRole('button', { name: '生成 dry-run 预览' }));
  await waitFor(() => expect(aiPlatform.cleanupOrphans).toHaveBeenCalledWith({ apply: false }));
  expect(screen.getByText(/dry-run：1 个文件/)).toBeInTheDocument();
  expect(aiPlatform.cleanupOrphans).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '执行计划清理' }));
  expect(await screen.findByText('执行有界孤儿清理')).toBeInTheDocument();
  const dialogs = screen.getAllByRole('dialog');
  expect(dialogs).toHaveLength(1);
  const submit = within(dialogs[0]).getByRole('button', { name: '确认删除' });
  expect(submit).toBeDisabled();
  fireEvent.change(within(dialogs[0]).getByPlaceholderText('请输入本次清理原因'), {
    target: { value: 'Remove verified dev orphan' },
  });
  fireEvent.click(submit);
  await waitFor(() => expect(aiPlatform.cleanupOrphans).toHaveBeenCalledTimes(2));
  expect(
    (aiPlatform.cleanupOrphans as jest.Mock).mock.calls.filter(([body]) => body.apply),
  ).toHaveLength(1);
}, 15000);

test('loads without unconnected Form warnings', async () => {
  const errors = jest.spyOn(console, 'error');
  const warnings = jest.spyOn(console, 'warn');
  try {
    render(
      <MemoryRouter>
        <AIAdmin />
      </MemoryRouter>,
    );
    await screen.findByRole('tab', { name: '模型' });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(errors.mock.calls.flat().join(' ')).not.toMatch(/not connected/i);
    expect(warnings.mock.calls.flat().join(' ')).not.toMatch(/not connected/i);
  } finally {
    errors.mockRestore();
    warnings.mockRestore();
  }
});

test('renders the admin workspace in English', async () => {
  await i18n.changeLanguage('en');
  render(
    <MemoryRouter>
      <AIAdmin />
    </MemoryRouter>,
  );
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: 'Account and administration' })).toBeInTheDocument(),
  );
  expect(screen.getByRole('tab', { name: 'Account' })).toBeInTheDocument();
  expect(screen.getByText('OJ user ID 42')).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Model' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Queue and storage' }));
  expect(screen.getByText('Task queue')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh audit' })).toBeInTheDocument();
});
