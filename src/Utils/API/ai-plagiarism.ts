import request, { service } from './request';

export type PlagiarismDecision = 'CLEAR' | 'SUSPICIOUS' | 'CONFIRMED';

export type PlagiarismPair = {
  left: string;
  right: string;
  left_username?: string;
  right_username?: string;
  left_submission_id?: string;
  right_submission_id?: string;
  similarity: number;
  matches: Array<Record<string, unknown>>;
  review?: { answer: string; citations: string[] } | null;
  review_status?: 'ready' | 'pending' | 'manual';
  decisions?: Array<{
    decision: PlagiarismDecision;
    reason: string;
    actor_id: string;
    created_at: string;
  }>;
};

export type PlagiarismResource = {
  id: string;
  kind: 'plagiarism';
  version: number;
  state: string;
  psid?: number;
  data: {
    title?: string;
    language?: string;
    threshold?: number;
    native_snapshot?: {
      id: string;
      count: number;
      psid: number;
      group_id: number;
      pid: number;
      selection_policy: 'latest' | 'best';
      sha256: string;
    };
    candidate?: {
      pairs: PlagiarismPair[];
      comparison_count: number;
      candidate_count: number;
      ai_reviewed_count: number;
      report?: string;
    };
    native_writeback?: { updated: number; at: string; actor_id: string };
  };
};

export type PlagiarismJob = {
  id: string;
  status: 'pending' | 'blocked' | 'running' | 'success' | 'failed' | 'cancelled';
  error?: string | null;
  result?: PlagiarismResource['data']['candidate'];
};

type NativeCreate = {
  psid: number;
  group_id: number;
  pid: number;
  operation_key: string;
  title: string;
  language: 'c' | 'cpp' | 'python' | 'java';
  threshold: number;
  selection_policy: 'latest' | 'best';
};

const base = '/ps/auto-task/ai';

export const plagiarismApi = {
  list: () =>
    request.post<{ rows: PlagiarismResource[]; totalNum: number }>(base + '/resources/list', {
      kind: 'plagiarism',
      pageNow: 1,
      pageSize: 50,
      keyword: '',
    }),
  get: (resourceId: string) => request.get<PlagiarismResource>(base + '/resources/' + resourceId),
  createNative: (body: NativeCreate) =>
    request.post<{
      taskId: string;
      resource_id: string;
      status: PlagiarismJob['status'];
      snapshot_count: number;
      replay: boolean;
    }>(base + '/native/plagiarism/create', body),
  getJob: (taskId: string) => request.get<PlagiarismJob>(base + '/jobs/' + taskId),
  reviewPair: (
    resourceId: string,
    version: number,
    pair: Pick<PlagiarismPair, 'left' | 'right'>,
    decision: PlagiarismDecision,
    reason: string,
  ) =>
    request.post<{ version: number; decision: PlagiarismDecision }>(
      base + '/plagiarism/' + resourceId + '/pairs/review',
      { version, left: pair.left, right: pair.right, decision, reason },
    ),
  writeback: (resourceId: string, version: number, reason: string, overwriteExisting: boolean) =>
    request.post<{ version: number; updated: number; replay: boolean }>(
      base + '/plagiarism/' + resourceId + '/writeback',
      {
        version,
        reason,
        require_all_reviewed: true,
        overwrite_existing: overwriteExisting,
      },
    ),
  downloadReport: async (resourceId: string) => {
    const response = await service.get(base + '/plagiarism/' + resourceId + '/report', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plagiarism-' + resourceId + '.jplag';
    link.click();
    window.URL.revokeObjectURL(url);
  },
};
