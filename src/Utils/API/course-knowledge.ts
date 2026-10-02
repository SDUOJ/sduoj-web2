import apiAddress from './apiAddress';
import request from './request';

export type CitationDetail = {
  citation: string;
  resource_id?: string;
  resource_version?: number;
  file_id?: string;
  file_name?: string | null;
  page?: number;
  offset?: number;
  source_sha256?: string | null;
  source?: string;
  evidence_confidence?: 'lexical_match' | 'requires_review';
  lexical_overlap?: string[];
  text?: string;
};

export type KnowledgeMessage = {
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
  citation_details?: CitationDetail[];
};

export type KnowledgeResource = {
  id: string;
  kind: 'document' | 'conversation' | 'course';
  version: number;
  state: string;
  course_id?: number | null;
  data: {
    title?: string;
    text?: string;
    file_ids?: string[];
    indexed_version?: number;
    messages?: KnowledgeMessage[];
  };
};

export type AiJob = {
  id: string;
  status: 'pending' | 'blocked' | 'running' | 'success' | 'failed' | 'cancelled';
  error?: string | null;
  result?: unknown;
};

const base = '/ps/auto-task/ai';

function operationKey(prefix: string) {
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}

async function waitForJob(taskId: string): Promise<AiJob> {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const job = await request.get<AiJob>(`${base}/jobs/${taskId}`);
    if (job.status === 'success') return job;
    if (job.status === 'failed' || job.status === 'cancelled') {
      throw new Error(job.error || `任务${job.status === 'failed' ? '失败' : '已取消'}`);
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  throw new Error('任务等待超时，请稍后刷新状态');
}

export const courseKnowledgeApi = {
  listDocuments: (courseId: number, pageNow = 1) =>
    request.post<{ rows: KnowledgeResource[]; totalNum: number }>(`${base}/resources/list`, {
      kind: 'document',
      course_id: courseId,
      pageNow,
      pageSize: 20,
    }),

  listConversations: (courseId: number) =>
    request.post<{ rows: KnowledgeResource[]; totalNum: number }>(`${base}/resources/list`, {
      kind: 'conversation',
      course_id: courseId,
      pageNow: 1,
      pageSize: 1,
    }),

  getResource: (resourceId: string) =>
    request.get<KnowledgeResource>(`${base}/resources/${resourceId}`),

  createDocument: (courseId: number, title: string) =>
    request.post<KnowledgeResource>(`${base}/resources/create`, {
      kind: 'document',
      course_id: courseId,
      data: { title, file_ids: [] },
    }),

  uploadFile: (resourceId: string, file: File, sequence: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('resource_id', resourceId);
    form.append('sequence', sequence);
    return request.post<{ id: string; sha256: string; size: number; replay?: boolean }>(
      `${base}/files/upload`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },

  updateDocumentFiles: (resource: KnowledgeResource, fileIds: string[]) =>
    request.post<KnowledgeResource>(`${base}/resources/${resource.id}/update`, {
      version: resource.version,
      data: { file_ids: fileIds },
    }),

  startIndex: (resource: KnowledgeResource) =>
    request.post<{ taskId: string; status: string }>(`${base}/jobs/create`, {
      task_type: 'course.index',
      operation_key: operationKey(`course-index-${resource.id}-v${resource.version}`),
      resource_id: resource.id,
      payload: {},
    }),

  indexDocument: async (resource: KnowledgeResource) => {
    const task = await courseKnowledgeApi.startIndex(resource);
    return waitForJob(task.taskId);
  },

  createConversation: (courseId: number) =>
    request.post<KnowledgeResource>(`${base}/resources/create`, {
      kind: 'conversation',
      course_id: courseId,
      data: { title: '课程问答' },
    }),

  ask: async (conversation: KnowledgeResource, message: string, externalResearch = false) => {
    const task = await request.post<{ taskId: string }>(`${base}/jobs/create`, {
      task_type: 'course.ask',
      operation_key: operationKey(`course-ask-${conversation.id}`),
      resource_id: conversation.id,
      payload: { message, external_research: externalResearch },
    });
    await waitForJob(task.taskId);
    return courseKnowledgeApi.getResource(conversation.id);
  },

  resolveCitation: (citation: string) =>
    request.get<CitationDetail>(`${base}/citations/resolve`, { citation }),

  fileUrl: (fileId: string, page?: number) => {
    const url = `${apiAddress().CLIENT_SERVER}/api${base}/files/${encodeURIComponent(fileId)}`;
    return page && page > 0 ? `${url}#page=${page}` : url;
  },
};
