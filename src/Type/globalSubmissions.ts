import type { RunDetail } from '../Component/answerIde/runTypes';
export interface GlobalSubmissionQuery {
  pageNow?: number;
  pageSize?: number;
  fromTs?: number;
  toTs?: number;
  bizType?: number;
  username?: string;
  problemCode?: string;
  judgeResult?: number;
  includeTasks?: boolean;
}
export interface GlobalSubmissionRow {
  submissionId: string;
  bizType: number;
  bizId: string;
  gmtCreate: string;
  username?: string;
  userId: string;
  problemId: string;
  problemCode?: string;
  judgeTemplateTitle?: string;
  judgeResult: number;
  judgeScore?: number;
  usedTime?: number;
  usedMemory?: number;
}
export interface GlobalSubmissionDetail extends RunDetail {
  code?: string;
  zipFileId?: string;
  checkpointResults?: [string | number, number, number, number, number][];
  publicCheckpointResults?: [string | number, number, number, number, number][];
  taskResults?: unknown[];
}

export interface OpsMetrics {
  observingSince?: number | string;
  timestamp: number | string;
  judgerOnline: number | null;
  queueDepth: number | string | null;
  throughputPerMin: number | null;
  avgWaitMs: number | null;
  p95WaitMs: number | string | null;
  waitSampleCount: number;
  metricsAvailable: boolean;
  onlineSource?: string;
  queueSource: string;
  windowMinutes: number;
  series: {
    timestamp: number | string;
    completed: number | string | null;
    queueDepth: number | string | null;
  }[];
}
