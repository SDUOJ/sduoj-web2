import request from './request';

export type AiResource = {
  id: string;
  kind: string;
  version: number;
  state: string;
  course_id?: number | null;
  data: {
    zh?: string;
    original?: string;
    title?: string;
    question_type?: string;
    language?: string;
    text?: string;
    file_ids?: string[];
    tags?: string[];
    answer?: string;
    explanation?: string;
    messages?: Array<{ role: 'user' | 'assistant'; text: string }>;
    verification?: {
      passed: boolean;
      evidence: string[];
      explanation: string;
      execution_blocked?: boolean;
    };
    options?: Array<{ label: string; zh: string }>;
    native?: {
      type: 'objective' | 'subjective' | 'programming';
      pid: string;
      group_id: number;
      description_id?: string;
    };
  };
};

export type CollectionItem = {
  number: number;
  question_id: string;
  status: 'active' | 'detached';
  batch_id: string;
  duplicate_of?: string;
  duplicate_detached?: boolean;
};

export type CollectionCollaboration = {
  collection_id: string;
  course_id?: number | null;
  role: 'owner' | 'editor' | 'contributor' | 'viewer';
  members: Array<{
    subject_id: string;
    username: string;
    role: 'editor' | 'contributor' | 'viewer';
    status: 'pending' | 'active' | 'revoked';
  }>;
  assignments: Array<{
    id: string;
    assignee_id: string;
    title: string;
    description?: string;
    status: string;
  }>;
};

export type CollaborationSummary = {
  id: string;
  title: string;
  course_id?: number | null;
  role: CollectionCollaboration['role'] | 'pending';
  version: number;
};

export type ResourceHistory = {
  totalNum: number;
  rows: Array<{
    id: string;
    version: number;
    state: string;
    deleted: boolean;
    data: AiResource['data'];
    sha256: string;
    created_at: string;
  }>;
};

type ProgramPlan = {
  version: number;
  marker: string;
  problem: Record<string, unknown>;
  description: Record<string, unknown>;
};

const base = '/ps/auto-task/ai';

function operationKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function waitForJob(taskId: string) {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const job = await request.get<{
      id: string;
      status: string;
      error?: string;
      result?: unknown;
    }>(`${base}/jobs/${taskId}`);
    if (job.status === 'success') return job;
    if (job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(job.error || `任务${job.status}`);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  throw new Error('任务等待超时，请稍后刷新');
}

export const aiWorkbench = {
  list: (pageNow = 1, keyword = '') =>
    request.post<{ rows: AiResource[]; totalNum: number }>(base + '/resources/list', {
      kind: 'question',
      pageSize: 20,
      pageNow,
      keyword,
    }),
  listCollections: (pageNow = 1, keyword = '', courseId?: number) =>
    request.post<{ rows: AiResource[]; totalNum: number }>(base + '/resources/list', {
      kind: 'collection',
      pageSize: 20,
      pageNow,
      keyword,
      course_id: courseId,
    }),
  detail: (id: string) => request.get<AiResource>(`${base}/resources/${id}`),
  history: (id: string) => request.get<ResourceHistory>(`${base}/resources/${id}/history`),
  update: (resource: AiResource, data: AiResource['data']) =>
    request.post<AiResource>(`${base}/resources/${resource.id}/update`, {
      version: resource.version,
      data,
    }),
  restoreVersion: (resourceId: string, version: number, revisionId?: string) =>
    request.post<AiResource>(`${base}/question-workflows/questions/${resourceId}/restore`, {
      version,
      revision_id: revisionId,
    }),
  intake: (data: {
    collection_id?: string;
    course_id?: number;
    title: string;
    text: string;
    file_ids: string[];
    batch_id?: string;
    assignment_id?: string;
    auto_solve: boolean;
    auto_verify: boolean;
  }) =>
    request.post<{ collection: AiResource; taskId: string; batch_id: string }>(
      `${base}/question-workflows/intake`,
      data,
    ),
  upload: (file: File, sequence: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('sequence', sequence);
    return request.post<{ id: string }>(`${base}/files/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  waitForJob,
  runQuestionTask: async (
    resourceId: string,
    taskType: 'question.solve' | 'question.verify' | 'question.chat',
    message?: string,
  ) => {
    const task = await request.post<{ taskId: string }>(
      `${base}/question-workflows/questions/${resourceId}/followup`,
      {
        operation_key: operationKey(taskType),
        task_type: taskType,
        message,
      },
    );
    await waitForJob(task.taskId);
    return request.get<AiResource>(`${base}/resources/${resourceId}`);
  },
  manifest: (collectionId: string) =>
    request.get<{
      resource_id: string;
      version: number;
      items: CollectionItem[];
      question_ids: string[];
    }>(`${base}/question-workflows/collections/${collectionId}/manifest`),
  collectionQuestions: (collectionId: string, pageNow = 1) =>
    request.get<{
      rows: Array<{ number: number; resource: AiResource }>;
      totalNum: number;
      pageIndex: number;
      pageSize: number;
      unavailable_numbers: number[];
    }>(`${base}/question-workflows/collections/${collectionId}/questions`, {
      pageNow,
      pageSize: 100,
    }),
  detachItem: (collectionId: string, number: number) =>
    request.post(
      `${base}/question-workflows/collections/${collectionId}/items/${number}/detach`,
      {},
    ),
  restoreItem: (collectionId: string, number: number) =>
    request.post(
      `${base}/question-workflows/collections/${collectionId}/items/${number}/restore`,
      {},
    ),
  detachDuplicate: (collectionId: string, number: number) =>
    request.post(
      `${base}/question-workflows/collections/${collectionId}/items/${number}/detach-duplicate`,
      {},
    ),
  restoreDuplicate: (collectionId: string, number: number) =>
    request.post(
      `${base}/question-workflows/collections/${collectionId}/items/${number}/restore-duplicate`,
      {},
    ),
  listCollaborations: () =>
    request.get<CollaborationSummary[]>(`${base}/collection-collaboration/list`),
  collaboration: (collectionId: string) =>
    request.get<CollectionCollaboration>(`${base}/collection-collaboration/${collectionId}`),
  inviteCollaborator: (
    collectionId: string,
    member: { subject_id: string; username: string; role: string; course_id?: number },
  ) => request.post(`${base}/collection-collaboration/${collectionId}/members`, member),
  acceptCollaboration: (collectionId: string) =>
    request.post(`${base}/collection-collaboration/${collectionId}/accept`, {}),
  revokeCollaborator: (collectionId: string, subjectId: string) =>
    request.post(
      `${base}/collection-collaboration/${collectionId}/members/${subjectId}/revoke`,
      {},
    ),
  createAssignment: (
    collectionId: string,
    assignment: { assignee_id: string; title: string; description?: string },
  ) => request.post(`${base}/collection-collaboration/${collectionId}/assignments`, assignment),
  importNative: (groupId: number, pid: string | number) =>
    request.post<AiResource>(base + '/native/import', { group_id: groupId, pid }),
  refreshNative: (resource: AiResource) => {
    if (!resource.data.native) throw new Error('该题目不是 OJ 导入题');
    return request.post<AiResource>(base + '/native/import', {
      group_id: resource.data.native.group_id,
      pid: resource.data.native.pid,
      refresh_resource_id: resource.id,
      version: resource.version,
    });
  },
  create: (type: string, text: string, options: string[] = [], answer = '') =>
    request.post<AiResource>(base + '/resources/create', {
      kind: 'question',
      data: {
        question_type: type,
        language: 'zh',
        original: text,
        zh: text,
        options: options.map((option, index) => ({
          label: String.fromCharCode(65 + index),
          zh: option,
          original: option,
        })),
        answer,
        tags: [],
      },
    }),
  publishQuestion: (resource: AiResource, groupId: number, labels: string[], score: number) =>
    request.post<{ pid: number; group_id: number }>(
      base + '/questions/' + resource.id + '/publish',
      {
        version: resource.version,
        group_id: groupId,
        correct_labels: labels,
        score,
        dry_run: false,
      },
    ),
  plan: (resource: AiResource) =>
    request.post<ProgramPlan>(base + '/native/program/' + resource.id + '/plan', {
      version: resource.version,
      title:
        resource.data.title ||
        resource.data.zh?.split('\n')[0].slice(0, 100) ||
        'AI programming problem',
    }),
  createProgram: (plan: ProgramPlan) =>
    request.post<string>('/manage/problem/create', plan.problem),
  getProgram: (code: string) =>
    request.get<{ defaultDescriptionId: string | number; source: string }>(
      '/manage/problem/query',
      {
        problemCode: code,
      },
    ),
  updateDescription: (id: string | number, code: string, plan: ProgramPlan) =>
    request.post<void>('/manage/problem/updateDescription', {
      ...plan.description,
      id,
      problemCode: code,
    }),
  bindProgram: (resource: AiResource, groupId: number, code: string, score = 100) =>
    request.post<{ problem_code: string; pid: string; replay: boolean }>(
      base + '/native/program/' + resource.id + '/bind',
      {
        version: resource.version,
        group_id: groupId,
        problem_code: code,
        score,
      },
    ),
};
