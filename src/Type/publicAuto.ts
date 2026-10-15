export type CheckerConfig = {
  source: string;
  spj?: string | null;
  inputValidator?: {
    source?: string | null;
    zipFileId?: string | number | null;
    spj: string;
  } | null;
  standardProgram?: {
    judgeTemplateId?: string | number;
    code?: string | null;
    zipFileId?: string | number | null;
  } | null;
  publicCasePolicy?: {
    autoAddEnabled: boolean;
    maxCount: number;
    inputNormalization?: 'raw' | 'trim-lines' | null;
  } | null;
};
export type PublicAutoGate = {
  eligible: boolean;
  failReasons: string[];
  fingerprint: string;
  validationTaskIds?: string[];
  standardCheckTaskIds?: string[];
  validationTaskId?: string;
  standardCheckTaskId?: string;
};
export type PublicAutoFill = {
  eligible: boolean;
  autoAddEnabled: boolean;
  maxCount: number;
  usedCount: number;
  added: number;
  skipped: number;
  items: {
    index: number;
    inputFileId: string;
    outputFileId?: string;
    checkpointId?: string;
    inputPreview?: string;
    sha256?: string;
    status: 'NEW' | 'EXISTS' | 'LIMIT' | 'ADDED' | 'FAILED';
    message?: string;
  }[];
};
