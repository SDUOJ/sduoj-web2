import request, { service } from './request';

export type AuthoringCheckpoint = {
  index: number;
  input: string;
  output: string;
  score: number;
  public: boolean;
  purpose: string;
  generated: boolean;
  seed?: number | null;
  input_sha256: string;
  output_sha256: string;
};

export type AuthoringCandidate = {
  title: string;
  description: string;
  reference_code: string;
  language: 'c' | 'cpp' | 'python' | 'java';
  generator_code: string;
  validator_code: string;
  generator_seeds: number[];
  explanation: string;
  test_plan: AuthoringCheckpoint[];
  revision: number;
  parent_hash: string;
  package_hash: string;
  validated: boolean;
};

export type AuthoringResource = {
  id: string;
  kind: 'authoring';
  version: number;
  state: string;
  data: {
    title?: string;
    requirements?: string;
    language?: string;
    difficulty?: string;
    topics?: string[];
    candidate?: AuthoringCandidate;
    native_publications?: Array<{
      problem_code: string;
      ready_for_judging: boolean;
      package_hash: string;
    }>;
  };
};

export type AuthoringJob = {
  id: string;
  status: 'pending' | 'blocked' | 'running' | 'success' | 'failed' | 'cancelled';
  error?: string | null;
};

export type AuthoringNativePlan = {
  resource_id: string;
  version: number;
  revision: number;
  package_hash: string;
  marker: string;
  problem: Record<string, unknown>;
  description: Record<string, unknown>;
  checkpoints: AuthoringCheckpoint[];
};

const base = '/ps/auto-task/ai';

export const authoringApi = {
  list: () =>
    request.post<{ rows: AuthoringResource[]; totalNum: number }>(base + '/resources/list', {
      kind: 'authoring',
      pageNow: 1,
      pageSize: 50,
      keyword: '',
    }),
  get: (resourceId: string) => request.get<AuthoringResource>(base + '/resources/' + resourceId),
  create: (value: {
    title: string;
    requirements: string;
    language: string;
    difficulty: string;
    topics: string[];
  }) =>
    request.post<AuthoringResource>(base + '/resources/create', {
      kind: 'authoring',
      data: value,
    }),
  generate: (resourceId: string, version: number, operationKey: string, instruction: string) =>
    request.post<{ taskId: string; status: AuthoringJob['status']; replay: boolean }>(
      base + '/authoring/' + resourceId + '/generate',
      { version, operation_key: operationKey, instruction },
    ),
  getJob: (taskId: string) => request.get<AuthoringJob>(base + '/jobs/' + taskId),
  review: (resourceId: string, version: number, accept: boolean, reason: string) =>
    request.post<{ state: string; version: number }>(
      base + '/resources/' + resourceId + '/review?accept=' + String(accept),
      { version, overwrite_manual: false, reason },
    ),
  nativePlan: (
    resourceId: string,
    value: {
      version: number;
      judge_template_id: number;
      title: string;
      time_limit: number;
      memory_limit: number;
      output_limit: number;
    },
  ) => request.post<AuthoringNativePlan>(base + '/authoring/' + resourceId + '/native-plan', value),
  createProgram: (problem: Record<string, unknown>) =>
    request.post<string>('/manage/problem/create', problem),
  getProgram: (problemCode: string) =>
    request.get<{
      source: string;
      defaultDescriptionId: string | number;
      checkpoints?: Array<{ checkpointId: number; checkpointScore: number }>;
    }>('/manage/problem/query', { problemCode }),
  updateDescription: (
    id: string | number,
    problemCode: string,
    description: Record<string, unknown>,
  ) => request.post<void>('/manage/problem/updateDescription', { ...description, id, problemCode }),
  uploadCheckpoint: (checkpoint: Pick<AuthoringCheckpoint, 'input' | 'output'>) =>
    request.post<{ checkpointId: number }>('/checkpoint/upload', {
      input: checkpoint.input,
      output: checkpoint.output,
      mode: null,
    }),
  configureProblem: (
    problemCode: string,
    plan: AuthoringNativePlan,
    checkpointIds: number[],
    judgeTemplateId: number,
  ) =>
    request.post<void>('/manage/problem/update', {
      problemCode,
      checkpoints: plan.checkpoints.map((item, index) => ({
        checkpointId: checkpointIds[index],
        checkpointScore: item.score,
      })),
      checkpointCases: plan.checkpoints
        .map((item, index) => (item.public ? checkpointIds[index] : null))
        .filter((value): value is number => value !== null),
      judgeTemplates: [judgeTemplateId],
    }),
  finalize: (
    resourceId: string,
    value: {
      version: number;
      group_id: number;
      problem_code: string;
      judge_template_id: number;
      score: number;
      checkpoints: Array<{ index: number; checkpoint_id: number }>;
    },
  ) =>
    request.post<{
      version: number;
      problem_code: string;
      ready_for_judging: boolean;
      replay: boolean;
    }>(base + '/authoring/' + resourceId + '/native-finalize', value),
  downloadBundle: async (resourceId: string) => {
    const response = await service.get(base + '/authoring/' + resourceId + '/bundle', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'authoring-' + resourceId + '.zip';
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
