import i18n from '../../Config/i18n';
export interface IdeContext {
  type: 0 | 1 | 2;
  bizId?: string;
  problemCode?: string;
  groupIndex?: number;
  problemIndex?: number;
}
export interface CodeSnapshot {
  submissionId: string;
  savedAt: number;
  judgeTemplateId: string;
  codeLength: number;
  lineCount?: number;
  code?: string;
}
export interface RunRecovery {
  detail: RunDetail | null;
  cooldownUntil?: number;
  hasActiveRun: boolean;
}
export interface RunRequest {
  context?: IdeContext;
  clientRequestId?: string;
  problemCode: string;
  judgeTemplateId: string;
  code: string;
  cases: Array<{ input: string; expectedOutput?: string }>;
  stdoutPrefixBytes?: number;
  stderrPrefixBytes?: number;
}
export interface RunCaseResult {
  index: number;
  input: string;
  expectedOutput?: string;
  judgeResult?: number;
  stdout?: string;
  stderr?: string;
  usedTime?: number;
  usedMemory?: number;
  exitCode?: number;
  stdoutTruncated?: boolean;
  stderrTruncated?: boolean;
  stdoutOriginalLength?: number;
  stderrOriginalLength?: number;
}
export interface RunDetail {
  taskType?: number;
  submissionId: string;
  judgeResult: number;
  judgeLog?: string;
  run?: { mode: string; cases: RunCaseResult[] };
}
export const runTerminal = (result: number) =>
  result === -1 || (result >= 1 && result <= 9) || result === 99;
export const runResultLabel = (result?: number) => {
  const value = result ?? 0;
  return i18n.t(`answerIde.state.${value}`, {
    defaultValue: i18n.t('answerIde.unknownState', { result: value }),
  });
};
