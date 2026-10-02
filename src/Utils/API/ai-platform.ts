import request from './request';

export type PlatformResource = {
  id: string;
  kind: string;
  version: number;
  state: string;
  course_id?: number;
  psid?: number;
  data: Record<string, unknown>;
};
export type JobStatus = 'pending' | 'blocked' | 'running' | 'success' | 'failed' | 'cancelled';
export type TokenUsage = {
  input_tokens?: number;
  cached_input_tokens?: number;
  output_tokens?: number;
};
export type PlatformJob = {
  id: string;
  task_type: string;
  status: JobStatus;
  resource_id?: string;
  attempt: number;
  max_attempts?: number;
  created_at?: string;
  finished_at?: string;
  review_required?: boolean;
  error?: string;
  result?: Record<string, unknown>;
  next_cursor?: number;
  ai_runs?: Array<{
    id: string;
    model: string;
    usage: TokenUsage;
    cost_usd: string;
    status: string;
    created_at?: string;
  }>;
  events?: Array<{ id: number; tag: string; content: unknown }>;
};
export type Account = {
  subject_id: string;
  balance?: string;
  status: string;
  reason?: string;
  permanent?: boolean;
};
export type Review = {
  id: string;
  subject_id: string;
  task_id?: string;
  decision: string;
  reason: string;
  reviewer_id?: string;
  created_at?: string;
  reviewed_at?: string;
  account_status?: string;
  account_reason?: string;
};
export type ModelOverride = {
  model: string;
  reasoning_effort: string;
  input_usd_per_million: number;
  cached_usd_per_million: number;
  output_usd_per_million: number;
};
export type ProviderSettings = {
  provider: string;
  model: string;
  base_url: string;
  reasoning_effort: string;
  input_usd_per_million: number;
  cached_usd_per_million: number;
  output_usd_per_million: number;
  max_task_cost_usd: number;
  max_concurrency: number;
  per_user_concurrency: number;
  max_queued_per_user: number;
  agent_concurrency: number;
  sandbox_concurrency: number;
  document_concurrency: number;
  max_output_tokens: number;
  max_prompt_bytes: number;
  monthly_user_budget_usd: number;
  monthly_course_budget_usd: number;
  timeout_seconds: number;
  max_storage_mb: number;
  model_overrides: Record<string, ModelOverride>;
  version: number;
  has_api_key: boolean;
};
export type ProviderHealth = {
  configured: boolean;
  ready: boolean;
  provider?: string;
  model?: string;
  latency_ms?: number;
  status_code?: number | null;
  reason?: string;
};
export type QueueMetrics = {
  counts: Partial<Record<JobStatus, number>>;
  cost_usd: string;
  settings: ProviderSettings;
};
export type StorageIssue = {
  id?: string;
  path: string;
  size?: number;
  expected_size?: number;
  actual_size?: number;
  modified_at?: string;
  age_seconds?: number;
  eligible?: boolean;
};
export type StorageAudit = {
  read_only: boolean;
  scanned_at: string;
  minimum_age_seconds: number;
  disk_file_count: number;
  registered_file_count: number;
  orphan_file_count: number;
  orphan_bytes: number;
  eligible_orphan_file_count: number;
  eligible_orphan_bytes: number;
  missing_file_count: number;
  metadata_mismatch_count: number;
  special_entry_count: number;
  invalid_database_path_count: number;
  orphans: StorageIssue[];
  missing_files: StorageIssue[];
  metadata_mismatches: StorageIssue[];
  special_entries: string[];
  invalid_database_paths: StorageIssue[];
  results_truncated: boolean;
};
export type OrphanCleanupInput = {
  apply?: boolean;
  reason?: string;
  minimum_age_seconds?: number;
  max_files?: number;
  max_bytes?: number;
  result_limit?: number;
};
export type OrphanCleanupResult = {
  applied: boolean;
  planned_file_count: number;
  planned_bytes: number;
  planned_files: StorageIssue[];
  deleted_file_count: number;
  deleted_bytes: number;
  deleted_files: StorageIssue[];
  skipped_files: Array<{ path: string; reason: string }>;
  remaining_eligible_file_count: number;
  audit: StorageAudit;
};
const base = '/ps/auto-task/ai';
export const aiPlatform = {
  nativeSubmit: (problemCode: string, judgeTemplateId: string, code: string) =>
    request.post<string>('/submit/create', { problemCode, judgeTemplateId, code }),
  nativeSubmission: (submissionId: string) =>
    request.get<{ judgeResult: number; judgeScore: number }>('/submit/query', { submissionId }),
  gradeNative: (body: {
    psid: number;
    gid: number;
    pid: number;
    username: string;
    operation_key: string;
  }) =>
    request.post<{ taskId: string; resource_id: string }>(base + '/native/grading/create', body),
  editGrade: (
    resource: PlatformResource,
    criteria: Array<{ name: string; score: number }>,
    comment: string,
    reason: string,
  ) =>
    request.post<PlatformResource>(base + '/grading/' + resource.id + '/edit', {
      version: resource.version,
      criteria,
      comment,
      reason,
    }),
  adoptGrade: (resource: PlatformResource, reason: string, overwrite_manual: boolean) =>
    request.post(base + '/grading/' + resource.id + '/adopt', {
      version: resource.version,
      reason,
      overwrite_manual,
    }),
  account: () => request.get<Account>(base + '/account'),
  capabilities: () =>
    request.get<{ admin: boolean; sandbox_enabled: boolean }>(base + '/capabilities'),
  list: (kind: string, pageNow = 1) =>
    request.post<{ rows: PlatformResource[]; totalNum: number }>(base + '/resources/list', {
      kind,
      pageNow,
      pageSize: 20,
    }),
  get: (id: string) => request.get<PlatformResource>(base + '/resources/' + id),
  create: (
    kind: string,
    data: Record<string, unknown>,
    scope: { psid?: number; course_id?: number } = {},
  ) => request.post<PlatformResource>(base + '/resources/create', { kind, data, ...scope }),
  update: (resource: PlatformResource, data: Record<string, unknown>) =>
    request.post<PlatformResource>(base + '/resources/' + resource.id + '/update', {
      version: resource.version,
      data,
    }),
  job: (id: string, after = 0) =>
    request.get<PlatformJob>(base + '/jobs/' + id, after > 0 ? { after } : undefined),
  jobs: (pageNow = 1, status?: JobStatus, psid?: number) =>
    request.post<{ rows: PlatformJob[]; totalNum: number }>(base + '/jobs/list', {
      pageNow,
      pageSize: 20,
      status,
      psid,
    }),
  submit: (
    resource: PlatformResource,
    task_type: string,
    operation_key: string,
    payload: Record<string, unknown> = {},
  ) =>
    request.post<{ taskId: string }>(base + '/jobs/create', {
      resource_id: resource.id,
      task_type,
      operation_key,
      payload,
    }),
  cancel: (id: string) => request.post(base + '/jobs/' + id + '/cancel', {}),
  retry: (id: string, operation_key: string) =>
    request.post<{ taskId: string }>(base + '/jobs/' + id + '/retry', { operation_key }),
  settings: () => request.get<ProviderSettings>(base + '/settings'),
  saveSettings: (settings: ProviderSettings & { api_key?: string }) =>
    request.post<ProviderSettings>(base + '/settings/update', {
      ...settings,
      expected_version: settings.version,
    }),
  health: () => request.get<ProviderHealth>(base + '/settings/health'),
  ledger: () =>
    request.get<
      Array<{
        id: string;
        amount: string;
        reason: string;
        cost_usd: string;
        task_id?: string;
        created_at?: string;
      }>
    >(base + '/points/ledger'),
  adjust: (body: { subject_id: string; amount: number; reason: string; operation_key: string }) =>
    request.post(base + '/points/adjust', body),
  reviews: () => request.get<Review[]>(base + '/reviews'),
  review: (id: string, decision: string, reason: string) =>
    request.post(base + '/reviews/' + id + '/update', { decision, reason }),
  unsettled: () =>
    request.get<{
      rows: Array<{
        id: string;
        task_id: string;
        model: string;
        payer_id?: string;
        usage: TokenUsage;
        created_at?: string;
      }>;
      totalNum: number;
    }>(base + '/admin/usage/unsettled'),
  reconcile: (
    id: string,
    usage: {
      input_tokens: number;
      cached_input_tokens: number;
      output_tokens: number;
      reason: string;
    },
  ) => request.post(base + '/admin/usage/' + id + '/reconcile', usage),
  queue: () => request.get<QueueMetrics>(base + '/admin/queue'),
  storageAudit: (minimumAgeSeconds = 24 * 60 * 60, resultLimit = 100) =>
    request.get<StorageAudit>(base + '/admin/storage/orphans', {
      minimum_age_seconds: minimumAgeSeconds,
      result_limit: resultLimit,
    }),
  cleanupOrphans: (body: OrphanCleanupInput = {}) =>
    request.post<OrphanCleanupResult>(base + '/admin/storage/orphans/cleanup', body),
  history: (id: string) =>
    request.get<{
      rows: Array<{
        id: string;
        version: number;
        actor_id: string;
        created_at: string;
        data: Record<string, unknown>;
      }>;
      totalNum: number;
    }>(base + '/resources/' + id + '/history'),
};
