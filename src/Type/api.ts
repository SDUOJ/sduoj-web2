export type ApiEnvelope<Payload> = {
  code: number;
  data?: Payload;
  message?: string | null;
  timestamp?: number | string | null;
};

export type JavaPage<Row> = {
  rows: Row[];
  totalNum: string;
  totalPage: string;
  pageSize: string;
  pageIndex: string;
};

export type AutoLabPage<Row> = {
  rows: Row[];
  totalNum: number;
  pageSize: number;
  pageIndex: number;
};

export type FileReference = {
  id: string;
  name?: string;
  size?: string;
  extensionName?: string;
  md5?: string;
  gmtCreate?: string;
  gmtModified?: string;
};

export type FileDownloadRequest = {
  id: string | number;
  downloadFilename?: string;
};

export type ContestRankRow = {
  userId: string;
  username: string;
  nickname: string;
  official: boolean;
  problemNum: number;
  submissions: Array<[string, string, number, number]> | null;
  problemResults: Array<[] | [string, number, number, number, number]> | null;
};

export type ProblemDescriptionListRow = {
  id: string;
  problemId: string;
  isPublic: number;
  userId: string;
  voteNum: number;
  title: string;
  username: string;
  problemCode: string;
};

export type ContestFeatures = {
  mode: string;
  openness: string;
  frozenTime: number;
  contestRunning: ContestVisibility;
  contestEnd: ContestVisibility;
};

export type ContestVisibility = {
  displayPeerSubmission: number;
  displayRank: number;
  displayJudgeScore: number;
  displayCheckpointResult: number;
  allowToSubmit: number;
};

export type ContestListRow = {
  contestId: string;
  contestTitle: string;
  gmtCreate: string;
  gmtModified: string;
  gmtStart: string;
  gmtEnd: string;
  features: ContestFeatures;
  isPublic: number;
  userId?: string;
  groupId?: string | null;
  source?: string | null;
  participantNum: number;
  username: string;
  managerGroupDTO?: { groupId: string; title: string } | null;
};

export type ContestInfo = Omit<ContestListRow, 'userId' | 'groupId' | 'managerGroupDTO'> & {
  markdownDescription: string | null;
  participants: string[];
  problems: Array<{
    problemCode: string;
    problemTitle: string;
    problemWeight: number;
    problemColor: string | null;
    acceptNum: number;
    submitNum: number;
    judgeResult: number | null;
    judgeScore: number | null;
  }>;
};

export type ProblemSetListRow = {
  psid: number;
  name: string;
  description: string | null;
  type: number;
  global_score: number;
  tm_start: string | null;
  tm_end: string | null;
  groupId: number;
  manageGroupId: number | null;
  tag: string;
  username: string;
};

export type ProblemSetTimeSetting = {
  tm_start: number;
  tm_end: number;
  weight: number;
};

export type ProblemSetInfo = ProblemSetListRow & {
  isAdmin: boolean;
  config: {
    useSameSE: number;
    usePractice?: number | null;
    practiceScoreCalculate?: string | null;
    practiceTimeSetting?: ProblemSetTimeSetting[] | null;
    showReport: number;
    showObjectiveAnswer?: number;
    showSubjectiveAnswer?: number;
    showSubjectiveJudgeLog?: number;
    showScoreInRunning: number;
    showProgramScoreInRunning: number;
    mergerSubjectiveGroup: number;
  };
  groupInfo: Array<{
    index: number;
    name: string;
    type: number;
    timeSetting: ProblemSetTimeSetting[] | null;
    point?: number;
    weighted_point: number;
    problemInfo: Array<{
      index: number;
      type?: number;
      name?: string;
      point?: number;
      weighted_point: number;
      pid_backup: number | string;
      submitLimit?: number;
      collect: number;
      hasAnswer: boolean;
      score?: number;
      hasJudge?: boolean;
      judgeLock?: string | null;
    }>;
  }>;
  latePermission: {
    discount: number;
    start_time?: number | null;
    expire_time?: number | null;
    duration_minute?: number | null;
    permission_id?: number;
    source: 'late_permission';
  } | null;
};

export const isApiRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isFileReference = (value: unknown): value is FileReference =>
  isApiRecord(value) && typeof value.id === 'string' && value.id.trim().length > 0;

export const isApiEnvelope = (value: unknown): value is ApiEnvelope<unknown> =>
  isApiRecord(value) &&
  typeof value.code === 'number' &&
  Number.isSafeInteger(value.code) &&
  (value.message === undefined || value.message === null || typeof value.message === 'string') &&
  (value.timestamp === undefined ||
    value.timestamp === null ||
    typeof value.timestamp === 'string' ||
    (typeof value.timestamp === 'number' && Number.isFinite(value.timestamp))) &&
  (value.code !== 0 || Object.prototype.hasOwnProperty.call(value, 'data'));
