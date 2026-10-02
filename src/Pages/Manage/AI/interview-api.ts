import request from '../../../Utils/API/request';

const base = '/ps/auto-task/ai';

export type InterviewStatus =
  'pending' | 'running' | 'awaiting_answer' | 'completed' | 'expired' | 'cancelled';

export type RubricCriterion = {
  name: string;
  max_score: number;
};

export type ScoredCriterion = RubricCriterion & {
  score: number;
  evidence?: string;
};

export type InterviewTurn = {
  question: string;
  focus?: string;
  answer: string | null;
  evaluation?: string;
  source_type?: 'question' | 'code' | 'report' | 'none';
  source_start_line?: number;
  source_end_line?: number;
};

export type InterviewCandidate = {
  summary: string;
  score: number;
  confidence: number;
  criteria: ScoredCriterion[];
  integrity_conclusion: 'pass' | 'review' | 'fail';
};

export type TeacherReview = {
  decision: 'approve' | 'reject';
  notes: string;
  score: number | null;
  maximum: number | null;
  criteria: ScoredCriterion[];
  reviewed_at: string;
};

export type InterviewData = {
  title: string;
  student_id: string;
  student_username: string;
  question: string;
  code: string;
  language: string;
  report: string;
  rubric: RubricCriterion[];
  max_questions: number;
  duration_minutes: number;
  status: InterviewStatus;
  expires_at: string;
  started_at?: string;
  turns: InterviewTurn[];
  media_policy: { required_tracks: MediaTrack[]; max_segment_seconds: number };
  evidence_policy?: {
    visibility: 'assigned_student_and_authorized_teachers';
    purpose: 'assessment_review';
    retention: 'platform_policy';
  };
  candidate?: InterviewCandidate;
  teacher_review?: TeacherReview;
  native_source?: { asd_id: number; psid: number; gid: number; pid: number; username: string };
  native_source_bound?: boolean;
  has_teacher_review?: boolean;
  renewed_from?: string;
};

export type MediaTrack = 'audio' | 'video' | 'screen';

export type MediaSegment = {
  file_id: string;
  turn_sequence: number;
  track: MediaTrack;
  segment_index: number;
  segment_count: number;
  started_ms: number;
  duration_ms: number;
  sha256: string;
  url: string;
};

export type ManifestGroup = {
  turn_sequence: number;
  track: MediaTrack;
  required: boolean;
  expected_segments: number | null;
  present_segments: number[];
  missing_segments: number[];
  complete: boolean;
  segments: MediaSegment[];
};

export type MediaManifest = { groups: ManifestGroup[]; complete: boolean };

export type InterviewResource = {
  id: string;
  kind: 'interview';
  version: number;
  state: string;
  role: 'student' | 'teacher';
  effective_status: InterviewStatus;
  course_id?: number;
  psid?: number;
  data: InterviewData;
  job?: { id: string; status: string; error?: string; attempt: number } | null;
  media_manifest?: MediaManifest;
};

export type InvitationInput = {
  operation_key: string;
  student_id: string;
  student_username: string;
  title: string;
  question?: string;
  code?: string;
  language?: string;
  report?: string;
  rubric: RubricCriterion[];
  max_questions: number;
  duration_minutes: number;
  expires_in_hours: number;
  required_tracks: MediaTrack[];
  course_id?: number;
  psid?: number;
  native_source?: { gid: number; pid: number; student_username: string };
};

export type ListResult = {
  pageIndex: number;
  pageSize: number;
  totalNum: number;
  rows: InterviewResource[];
};

export function operationKey(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`.slice(0, 96);
}

export const interviewApi = {
  list: (pageNow: number, scope: 'all' | 'assigned' | 'managed', status?: string) =>
    request.post<ListResult>(base + '/interviews/list', {
      pageNow,
      pageSize: 20,
      scope,
      status: status || null,
    }),
  invite: (input: InvitationInput) =>
    request.post<InterviewResource>(base + '/interviews/invite', input),
  session: (resourceId: string) =>
    request.get<InterviewResource>(base + `/interviews/${resourceId}/session`),
  preflight: (resourceId: string, evidence: Record<string, boolean>) =>
    request.post<{ taskId: string; status: string }>(base + `/interviews/${resourceId}/preflight`, {
      operation_key: operationKey('preflight'),
      sequence: 0,
      text: '',
      evidence,
    }),
  upload: async (resourceId: string, sequence: string, file: File) => {
    const form = new FormData();
    form.append('resource_id', resourceId);
    form.append('sequence', sequence);
    form.append('file', file);
    return request.post<{ id: string; sha256: string; size: number; replay?: boolean }>(
      base + '/files/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
  attach: (resourceId: string, value: Omit<MediaSegment, 'url'>) =>
    request.post<{ attached: boolean; version: number; manifest: MediaManifest }>(
      base + `/interviews/${resourceId}/media/attach`,
      value,
    ),
  manifest: (resourceId: string, turnSequence?: number) =>
    request.get<MediaManifest>(
      base + `/interviews/${resourceId}/media/manifest`,
      turnSequence === undefined ? undefined : { turn_sequence: turnSequence },
    ),
  answer: (
    resourceId: string,
    sequence: number,
    version: number,
    text: string,
    fileIds: string[],
  ) =>
    request.post<{ taskId: string; status: string; version: number }>(
      base + `/interviews/${resourceId}/responses`,
      {
        operation_key: operationKey(`turn-${sequence}`),
        sequence,
        version,
        text,
        file_ids: fileIds,
      },
    ),
  retryJob: (resourceId: string) =>
    request.post<{ taskId: string; status: string }>(
      base + `/interviews/${resourceId}/jobs/retry`,
      {
        operation_key: operationKey('retry'),
      },
    ),
  renew: (resourceId: string, version: number, expiresInHours: number) =>
    request.post<InterviewResource>(base + `/interviews/${resourceId}/renew`, {
      operation_key: operationKey('renew'),
      version,
      expires_in_hours: expiresInHours,
    }),
  review: (
    resourceId: string,
    version: number,
    decision: 'approve' | 'reject',
    notes: string,
    criteria: Array<{ name: string; score: number }>,
  ) =>
    request.post<{ state: string; version: number; native_adoption_available: boolean }>(
      base + `/interviews/${resourceId}/teacher-review`,
      { version, decision, notes, criteria },
    ),
  adopt: (resourceId: string, version: number, reason: string, overwriteManual = false) =>
    request.post<{ adopted: boolean; asd_id: number; version: number }>(
      base + `/interviews/${resourceId}/adopt`,
      { version, reason, overwrite_manual: overwriteManual },
    ),
  cancel: (resourceId: string) =>
    request.post<{ status: string }>(base + `/interviews/${resourceId}/cancel`, {}),
};
