import { AxiosRequestConfig } from 'axios';
import { Sex } from './Iuser';
import React from 'react';

export interface Get {
  <T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T>;
}

export interface Post {
  <T = any>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T>;
}

export interface GetError {
  (url: string, data?: object, config?: AxiosRequestConfig): void;
}

export enum rolesInString {
  S = 'superadmin',
  A = 'admin',
  U = 'user',
}

export interface query {
  pageNow: number;
  pageSize: number;
  sortBy?: string;
}

export interface studentBasic {
  username: string;
  nickname?: string;
  email?: string;
  studentId?: number | string;
  emailVerified?: boolean;
  roles: rolesInString[];
  features?: {
    banThirdParty: any;
    banEmailUpdate: any;
    banInfoUpdate: any;
  };
}

export interface functionTemplate {
  judgeTemplateId: number;
  isShowFunctionTemplate: number;
  functionTemplate?: string;
  initialTemplate?: string;
}

export interface problemBasic {
  problemCode: string;
  isPublic?: boolean;
  problemTitle?: string;
  source?: string;
  languages?: string[];
  memoryLimit?: string | number;
  timeLimit?: string | number;
  defaultDescriptionId?: number;
  judgeTemplates?: number[];
  managerGroups?: number[];
  functionTemplates?: functionTemplate[];
}

export interface problemDescription {
  problemCode?: string;
  id?: string | number;
  title?: string;
  markdownDescription?: string;
  isPublic?: number;
}

export interface checkPointData {
  input: string;
  output: string;
  mode: string;
}

export interface multiCheckpointFileUpload {
  files: any[];
  mode: string;
}

export interface modifyProblemsCheckPoint {
  problemCode: string;
  checkpoints: {
    checkpointId: string | number;
    checkpointScore: number;
  }[];
  checkpointCases: string[];
}

export type problemListQuery = query & {
  ascending?: boolean;
  remoteOj?: any;
};

export type groupListQuery = query & {
  title?: string;
  isParticipating?: string;
};

export type announcementListQuery = query & {
  title?: string;
};

export type announcementQuery = {
  id: string | number;
};

export type submissionListQuery = query & {
  problemCode?: string;
  username?: string;
  language?: string;
  status?: string;
};

export interface problemSetRouter {
  psid: number | string;
  gid: number | string;
  pid: number | string;
}

export interface problemSetRouterQuery {
  router: problemSetRouter;
}

export interface problemSetAnswerPayload extends problemSetRouterQuery {
  data: unknown;
}

export interface problemSetJudgeListQuery {
  pageNow: number;
  pageSize: number;
  psid: number;
  proStr?: string | null;
  gid?: number | null;
  pid?: number | null;
  username?: string | null;
  judgeLock?: string | null;
  hasJudge?: number | null;
  review_queue?: string | null;
}

export interface problemSetJudgeInfoQuery {
  psid: number;
  gid: number;
  pid: number;
  username: string;
}

export interface problemSetJudgeLog {
  name: string;
  score: number;
  jScore: number;
}

export interface problemSetJudgeUpdatePayload extends problemSetJudgeInfoQuery {
  judgeLog: problemSetJudgeLog[];
  judgeComment?: string | null;
  cancel?: number | null;
}

export interface problemSetSummaryQuery {
  psid: number;
  code: number;
}

export interface problemSetLabelListQuery {
  groupId: number;
}

export interface problemSetSearchQuery {
  pageNow: number;
  pageSize: number;
  groupId: number;
  tag: string;
}

export interface problemSetSubmissionQuery {
  router: problemSetRouter;
  problemSetId?: number | string;
  username?: string;
  pageNow?: number;
  pageSize?: number;
}

export interface problemSetSubmissionInfoQuery {
  psid: number | string;
  gid: number | string;
  pid: number | string;
  submissionId: string;
}

export interface problemSetPublicQuery {
  psid: number | string;
}

export type userListQuery = query & {
  username: string;
  studentId?: number | string;
  phone?: number | string;
  email?: string;
  sduld?: any;
  searchKey?: string;
};

export interface judgeTemplate {
  type: number;
  title: string;
  shellScript: string;
  zipFileId: number | string;
  acceptFileExtensions: string[];
  comment: string;
}

export interface contestVisibility {
  displayPeerSubmission: number;
  displayRank: number;
  displayJudgeScore: number;
  displayCheckpointResult: number;
  allowToSubmit: number;
}

export interface contestFeatures {
  mode: 'acm' | 'oi' | 'ioi';
  openness: 'public' | 'protected' | 'private';
  frozenTime: number;
  contestRunning?: contestVisibility;
  contestEnd?: contestVisibility;
}

export interface contestProblem {
  problemCode: string;
  problemTitle?: string;
  problemDescriptionId?: number;
  problemWeight?: number;
  problemColor?: string;
  submitNumber?: number;
}

/** Payload shared by the manage contest create, update and fork forms. */
export interface contestManagePayload {
  contestId?: number;
  contestTitle: string;
  isPublic: number;
  password?: string;
  gmtStart: number;
  gmtEnd: number;
  source?: string;
  markdownDescription?: string;
  features: contestFeatures;
  participants?: string[];
  unofficialParticipants?: string[];
  groupId?: number;
  participatingGroups?: number[];
  problems: contestProblem[];
}

export interface contestComprehensiveExportParams {
  contestId: number;
}

export type contestListQuery = query & {
  groupId?: number | string;
  mode?: contestFeatures['mode'];
  openness?: contestFeatures['openness'];
};

export type contestUpcomingQuery = {
  groupId?: number | string;
};

export type contestSubmissionQuery = query & {
  contestId: string;
  problemCode?: string;
  username?: string;
  status?: string;
};

export interface contestSubmissionPayload {
  contestId: string;
  problemCode: string;
  judgeTemplateId: string;
  code?: string;
  zipFileId?: string;
}

export interface contestReportItem {
  contestId: string;
  title: string;
  weight: number;
  timeoutScoreRatio: Array<[string, number]>;
}

export interface contestReportParams {
  contestList: contestReportItem[];
}

export type loginInfo = {
  username: string;
  password: string;
};

export type registerInfo = {
  username: string;
  password: string;
  email: string;
  emailCode: string;
};

export type updateEmailInfo = {
  password: string;
  email: string;
  emailCode: string;
};

export type resetPasswordInfo = {
  password: string;
  token: string;
};

export type userExistQuery =
  { username: string; email?: never } | { email: string; username?: never };

export type thirdPartyRegisterInfo = registerInfo & {
  token: string;
};

export type thirdPartyBindingInfo = {
  username: string;
  password: string;
  token: string;
};

export interface groupInfo {
  openness: number;
  title: string;
  description: string;
  markdown: string;
  groupId?: number;
  features?: {
    isAbleQuit: boolean;
  };
}

export type updateUserStates = {
  groupId: number;
  userIds: number[];
  status: number;
};

export type forgetInfo = {
  username: string;
  email: string;
  captchaId: string;
  captcha: string;
};

export type profileInfo = {
  nickname: string;
  phone: string;
  gender: Sex;
  studentId: number;
};

export type emailType = 'login' | 'register' | 'thirdPartyRegisterOrBinding' | 'updateEmail';

export type verificationEmail = {
  email: string;
  captcha: string;
  captchaId: string;
  event: emailType;
};

export type updatePassWord = {
  password: string;
  newPassword: string;
};

export type examID = string | number;

export type ProblemID = {
  pid: string;
};

export type thirdPartyLogin = {
  thirdParty: string;
  ticket: string;
};
