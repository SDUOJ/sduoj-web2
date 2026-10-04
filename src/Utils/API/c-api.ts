import {
  forgetInfo,
  loginInfo,
  problemListQuery,
  profileInfo,
  registerInfo,
  resetPasswordInfo,
  thirdPartyLogin,
  thirdPartyBindingInfo,
  thirdPartyRegisterInfo,
  updateEmailInfo,
  updatePassWord,
  userExistQuery,
  verificationEmail,
  contestListQuery,
  contestUpcomingQuery,
  contestSubmissionQuery,
  contestSubmissionPayload,
  contestReportParams,
  groupListQuery,
  announcementListQuery,
  announcementQuery,
  submissionListQuery,
  problemSetRouterQuery,
  problemSetAnswerPayload,
  problemSetJudgeListQuery,
  problemSetJudgeInfoQuery,
  problemSetJudgeUpdatePayload,
  problemSetSummaryQuery,
  problemSetLabelListQuery,
  problemSetSearchQuery,
  problemSetSubmissionQuery,
  problemSetSubmissionInfoQuery,
  problemSetPublicQuery,
} from '../../Type/types';
import request from './request';
import apiAddress from './apiAddress';
import { AxiosRequestConfig } from 'axios';
import {
  AutoLabPage,
  ContestInfo,
  ContestListRow,
  ContestRankRow,
  FileReference,
  JavaPage,
  ProblemSetListRow,
  ProblemSetInfo,
} from '../../Type/api';
import { UserInfo, thirdPartyLoginResponse } from '../../Type/Iuser';

type AcceptanceQueueCache = {
  psid: number;
  data: string[];
  ts: number;
};

let acceptanceQueueCache: AcceptanceQueueCache | undefined;

const cApi = {
  // Config
  async getCopyright() {
    return request.get<string>('/site/getCopyright');
  },

  // User
  async login(data: loginInfo) {
    return request.post<UserInfo>('/user/login', data);
  },
  async emailLogin(data: { email: string; emailCode: string }) {
    return request.post<UserInfo>('/user/emailLogin', data);
  },
  async logout() {
    return request.get<null>('/user/logout');
  },
  async register(data: registerInfo) {
    return request.post<UserInfo>('/user/register', data);
  },
  async forgetPassword(data: forgetInfo) {
    return request.post<string>('/user/forgetPassword', data);
  },
  async getProfile() {
    return request.get<UserInfo>('/user/getProfile');
  },
  async updateProfile(data: profileInfo) {
    return request.post<null>('/user/updateProfile', data);
  },
  async updatePassword(data: updatePassWord) {
    return request.post<null>('/user/updatePassword', data);
  },
  async updateEmail(data: updateEmailInfo) {
    return request.post<null>('/user/updateEmail', data);
  },
  async sendVerificationEmail(data: verificationEmail) {
    return request.post<number>('/user/sendVerificationEmail', data);
  },
  async resetPassword(data: resetPasswordInfo) {
    return request.post<null>('/user/resetPassword', data);
  },
  async getCaptcha() {
    return request.get<{ captchaId: string; captcha: string }>('/user/getCaptcha');
  },
  async isExist(data: userExistQuery) {
    return request.get<boolean>('/user/isExist', data);
  },
  async queryParticipateContest() {
    return request.get('/user/queryParticipateContest');
  },

  // 第三方登录相关
  async thirdPartyLogin(data: thirdPartyLogin) {
    // await sleep(2000)
    // return Promise.resolve({
    //     thirdParty: "SDUCAS",
    //     sduRealName: "XXX",
    //     sduId: "2018XXXXXXXX",
    //     user: null,
    //     token: "1111111"
    // })
    return request.get<thirdPartyLoginResponse>('/user/thirdPartyLogin', data);
  },
  async thirdPartyUnbinding(data: { thirdParty: string }) {
    return request.get('/user/thirdPartyUnbinding', data);
  },
  //// 注册新账号并绑定已有账号
  async thirdPartyRegister(data: thirdPartyRegisterInfo) {
    return request.post<UserInfo>('/user/thirdPartyRegister', data);
  },
  //// 绑定已有账号
  async thirdPartyBinding(data: thirdPartyBindingInfo) {
    return request.post<UserInfo>('/user/thirdPartyBinding', data);
  },

  // 文件相关
  async uploadFile(data: FormData, config?: AxiosRequestConfig) {
    return request.post<FileReference[]>('/filesys/uploadFiles', data, {
      ...config,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async uploadSingleFile(data: FormData, config?: AxiosRequestConfig) {
    return request.post<FileReference>('/filesys/upload', data, {
      ...config,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  async getFileByMD5(data: { md5: string }, config?: AxiosRequestConfig) {
    return request.get<FileReference | null>('/filesys/queryByMd5', data, config);
  },
  getFileDownloadUrl(id: string, name: string) {
    return (
      apiAddress().CLIENT_SERVER +
      '/api/filesys/download/' +
      encodeURIComponent(id) +
      '/' +
      encodeURIComponent(name)
    );
  },

  // 比赛相关
  async getContestList(data: contestListQuery) {
    return request.get<JavaPage<ContestListRow>>('/contest/list', data);
  },
  async invalidateContestSubmission(data: { submissionId: string; contestId: string }) {
    return request.get('/contest/invalidateSubmission', data);
  },
  async getUpcomingContest(data: contestUpcomingQuery) {
    return request.get('/contest/queryUpcomingContest', data);
  },
  async getContestProblem(data: { contestId: string; problemCode: string }) {
    return request.get('/contest/queryProblem', data);
  },
  async getContestAcProblem(data: { contestId: string }) {
    return request.get('/contest/queryACProblem', data);
  },
  async participateContest(data: { contestId: string; password?: string }) {
    return request.post('/contest/participate', data);
  },
  async submitContestProblem(data: contestSubmissionPayload) {
    return request.post('/contest/createSubmission', data);
  },
  async getContestInfo(data: { contestId: string }) {
    return request.get<ContestInfo>('/contest/query', data);
  },
  async getContestSubmissionList(data: contestSubmissionQuery) {
    return request.get('/contest/listSubmission', data);
  },
  async rejudgeInContest(data: { contestId: string; submissionIds: string[] }) {
    return request.post('/contest/rejudge', data);
  },
  async getContestSubmissionInfo(data: { contestId: string; submissionId: string }) {
    return request.get('/contest/querySubmission', data);
  },
  async getRank(data: { contestId: string }) {
    return request.get<ContestRankRow[]>('/contest/rank', data);
  },
  async submitInContest(data: contestSubmissionPayload) {
    return request.post('/contest/createSubmission', data);
  },
  async getContestReport(data: contestReportParams) {
    return request.post('/contest/comprehensiveReport', data);
  },

  // 比赛问答
  async createQuestion(data: { contestId: string; title: string; message: string }) {
    return request.post('/contest/createQuestion', data);
  },
  async replyQuestion(data: {
    contestId: string;
    message: string;
    rootId: string;
    parentId: string;
  }) {
    return request.post('/contest/reply', data);
  },
  async deleteQuestion(data: { clarificationId: string }) {
    return request.get('/contest/delete', data);
  },
  async getQuestionList(data: { contestId: string }) {
    return request.get('/contest/listQuestion', data);
  },
  async getQuestionDetail(data: { clarificationId: string }) {
    return request.get('/contest/questionDetail', data);
  },

  // 公告相关
  async getAnnouncementList(data: announcementListQuery) {
    return request.get('/notice/list', { ...data, filter: 'default' });
  },
  async getAnnouncement(data: announcementQuery) {
    return request.get('notice/query', data);
  },

  // 提交相关
  async rejudge(data: string[]) {
    return request.post('/submit/rejudge', data);
  },
  async getSubmissionInfo(data: { submissionId: string }) {
    return request.get('/submit/query', data);
  },
  async getSubmissionList(data: submissionListQuery) {
    return request.get('/submit/list', data);
  },
  async getACProblem() {
    return request.get('/submit/queryACProblem');
  },
  async invalidateSubmission(data: { submissionId: string }) {
    return request.get('/submit/invalidateSubmission', data);
  },
  async submit(data: {
    problemCode: string;
    judgeTemplateId: string;
    code?: string;
    zipFileId?: string;
  }) {
    return request.post('/submit/create', data);
  },

  // 题目相关
  async getProblemList(data: problemListQuery) {
    return request.get('/problem/list', data);
  },
  async getProblemInfo(data: { problemCode: string; descriptionId?: string }) {
    return request.get('/problem/query', data);
  },

  // 用户组相关
  async getGroupInfo(data: { groupId: string }) {
    return request.get('/group/query', data);
  },
  async getMyGroup() {
    return request.get('/group/my');
  },
  async getGroupList(data: groupListQuery) {
    return request.get('/group/page', data);
  },
  async joinGroupApply(data: { groupId: string }) {
    return request.get('/group/apply', data);
  },
  async quitGroup(data: { groupId: string }) {
    return request.get('/group/quit', data);
  },

  // 题单相关
  async getProblemSetInfo(data: { psid: number | string }) {
    return request.post<ProblemSetInfo>('/ps/problem_set/info_c', data);
  },
  // 获取全局 upcoming 题单（running/upcoming）
  async getUpcomingProblemSet() {
    return request.get('/ps/problem_set/upcoming');
  },
  // 获取单个题目信息
  async getProblemSetProblem(data: problemSetRouterQuery) {
    return request.post('/ps/problem_set/pro_info', data);
  },

  // 提交题目答案
  async submitProblemSetProblem(data: problemSetAnswerPayload) {
    return request.post('/ps/answer_sheet/answer', data);
  },
  // 获取答题卡信息
  async getProblemSetProblemAS(data: problemSetRouterQuery) {
    return request.post('/ps/answer_sheet/info', data);
  },
  // 标记客观题选项
  async markObjectiveProblem(data: problemSetAnswerPayload) {
    return request.post('/ps/answer_sheet/mark', data);
  },
  // 标记题目
  async updateProblemSetProblemCollect(data: problemSetRouterQuery) {
    return request.post('/ps/answer_sheet/collect', data);
  },

  // 编程题提交列表
  async getProblemSetSubmissionList(data: problemSetSubmissionQuery) {
    return request.post('/ps/answer_sheet/submissionList', data);
  },
  // 编程题提交详情
  async getProblemSetSubmissionInfo(data: problemSetSubmissionInfoQuery) {
    return request.post('/ps/answer_sheet/submissionInfo', data);
  },
  // 导出主观题（文件题）附件
  async exportProblemSetSubjectiveZip(
    data: { router: { psid: number; gid: number; pid: number } },
    filename?: string,
  ) {
    return request.getZipFile('/ps/answer_sheet/subjective/exportZip', data, {}, filename);
  },
  // 题单交卷
  async finishProblemSet(data: problemSetRouterQuery) {
    return request.post('/ps/answer_sheet/finish', data);
  },

  // 获取评阅列表
  async getJudgeList(data: problemSetJudgeListQuery) {
    return request.post('/ps/judge/list', data);
  },
  // 查询题单内所有验收题可用队列（去重排序）缓存30s
  async getAcceptanceQueueList(data: { psid: number }) {
    if (
      acceptanceQueueCache &&
      acceptanceQueueCache.psid === data.psid &&
      Date.now() - acceptanceQueueCache.ts < 30000
    ) {
      return acceptanceQueueCache.data;
    }
    return request.post<string[]>('/ps/answer_sheet/acceptanceQueueList', data).then((res) => {
      acceptanceQueueCache = { psid: data.psid, data: res, ts: Date.now() };
      return res;
    });
  },
  clearAcceptanceQueueCache() {
    acceptanceQueueCache = undefined;
  },
  // 获取评阅信息
  async getJudgeInfo(data: problemSetJudgeInfoQuery) {
    return request.post('/ps/judge/info', data);
  },
  // 更新评阅信息
  async updateJudgeInfo(data: problemSetJudgeUpdatePayload) {
    return request.post('/ps/judge/add', data);
  },
  // 显示题单总结信息，用于显示 Rank
  async getProblemSummary(data: problemSetSummaryQuery) {
    return request.post('/ps/summary/summary', data);
  },
  // 获取榜单的题目预览数据
  async getProblemSetProPreview(data: problemSetJudgeInfoQuery) {
    return request.post('/ps/summary/preview', data);
  },
  // 获取题单的标签列表
  async getProblemSetLabelList(data: problemSetLabelListQuery) {
    return request.post('/ps/problem_set/key', data);
  },
  // 获取题单列表
  async getProblemSetList(data: problemSetSearchQuery) {
    return request.post<AutoLabPage<ProblemSetListRow>>('/ps/problem_set/search', data);
  },
  // 获取题目组下所有题单（按标签组织）
  async getProblemSetListByGroup(data: { groupId: number }) {
    return request.post('/ps/problem_set/list_by_group', data);
  },
  // 获取题单公开信息
  async getProblemSetPublic(data: problemSetPublicQuery) {
    return request.post('/ps/problem_set/public', data);
  },
  // 自动化任务 - 创建主观题评阅任务
  async createProblemSetSubjectiveAutoTasks(data: {
    tasks: Array<{
      psid: number;
      gid: number;
      pid: number;
      username: string;
      programmingProblems?: Array<{ gid: number; pid: number }>;
    }>;
  }) {
    return request.post('/ps/auto-task/subjective/review', data);
  },
  // 自动化任务 - 查询题单任务列表
  async listProblemSetAutoTasks(data: {
    psid: number;
    pageNow: number;
    pageSize: number;
    status?: string;
    taskType?: string;
    username?: string;
    scoreLe?: number;
  }) {
    return request.post('/ps/auto-task/list', data);
  },
  // 自动化任务 - 任务详情
  async getProblemSetAutoTaskDetail(taskId: string) {
    return request.get(`/ps/auto-task/detail/${taskId}`);
  },
  // 自动化任务 - 主观题/学生选项
  async getProblemSetAutoTaskOptions(psid: number) {
    return request.get(`/ps/auto-task/subjective/options/${psid}`);
  },
  // 自动化任务 - 重新执行任务
  async rerunProblemSetAutoTask(taskId: string) {
    return request.post(`/ps/auto-task/rerun/${taskId}`, {});
  },
  // 自动化任务 - 删除任务
  async deleteProblemSetAutoTask(taskId: string) {
    return request.post(`/ps/auto-task/delete/${taskId}`, {});
  },
  async listProblemSetLatePermissions(data: {
    psid: number;
    page: { pageSize: number; pageNow: number };
    username?: string;
  }) {
    return request.post('/ps/problem_set/late/list', data);
  },
  async addProblemSetLatePermission(data: {
    psid: number;
    username: string;
    expire_time: number;
    discount: number;
    note?: string;
  }) {
    return request.post('/ps/problem_set/late/add', data);
  },
  async updateProblemSetLatePermission(data: {
    psid: number;
    id: number;
    expire_time?: number;
    discount?: number;
    is_active?: boolean;
    note?: string;
  }) {
    return request.post('/ps/problem_set/late/update', data);
  },
  async batchAddProblemSetLatePermission(data: {
    groupId: number;
    psids: number[];
    username: string;
    expire_time: number;
    discount: number;
    note?: string;
  }) {
    return request.post('/ps/problem_set/late/batch_add', data);
  },

  //   ---- 公共数据集 -----
  // 新增一个公共数据
  async addPublicCheckpoints(data: any) {
    return request.post('/problem/appendCheckpoints', data);
  },
  // 列出题目的检查点
  async getPublicCheckpoints(data: { problemId: number }) {
    return request.get('/problem/listCheckpoints', data);
  },
  // 删除题目的检查点
  async delPublicCheckpoints(data: any) {
    return request.post('/problem/deleteCheckpoints', data);
  },

  // 新增一个公共数据
  async addPsPublicCheckpoints(data: any) {
    return request.post('/ps/answer_sheet/pbcp/add', data);
  },
  // 列出题目的检查点
  async getPsPublicCheckpoints(data: any) {
    return request.post('/ps/answer_sheet/pbcp/get', data);
  },
  // 删除题目的检查点
  async delPsPublicCheckpoints(data: any) {
    return request.post('/ps/answer_sheet/pbcp/del', data);
  },

  // 查询互评列表
  async getSMEList(data: any) {
    return request.get('/sme/', data);
  },
  // 提交互评结果
  async submitSME(data: any) {
    return request.post('/sme/', data);
  },
  // 查看互评结果
  async getSMEResult(data: any) {
    return request.get('/sme/results/', data);
  },
  // 获取个人/组内题单汇总分析
  async getPersonalTagSummary(data: { groupId: number; username?: string; force?: boolean }) {
    return request.post<any>('/ps/summary/personal_tag_summary', data);
  },

  // ============ 通用自动任务 API ============
  // 创建总结报告导出任务
  async createSummaryExportTask(data: { groupId: number; psids?: number[] }) {
    return request.post('/ps/auto-task/summary/export', data);
  },
  // 查询小组级自动任务列表
  async listGroupAutoTasks(data: {
    groupId: number;
    pageNow: number;
    pageSize: number;
    status?: string;
    taskType?: string;
    username?: string;
    scoreLe?: number;
    psid?: number;
    contestId?: number;
    problemId?: number;
  }) {
    return request.post('/ps/auto-task/list', data);
  },
  // 获取自动任务详情
  async getAutoTaskDetail(taskId: string) {
    return request.get(`/ps/auto-task/detail/${taskId}`);
  },
  // 重新执行自动任务
  async rerunAutoTask(taskId: string) {
    return request.post(`/ps/auto-task/rerun/${taskId}`, {});
  },
  // 删除自动任务
  async deleteAutoTask(taskId: string) {
    return request.post(`/auto-task/delete/${taskId}`, {});
  },
  // 获取小组的主观题评阅任务选项
  async getGroupSubjectiveAutoTaskOptions(groupId: number) {
    return request.get(`/ps/auto-task/subjective/options/${groupId}`);
  },
  // 创建小组级主观题评阅任务
  async createGroupSubjectiveAutoTasks(data: {
    groupId: number;
    tasks: Array<{
      psid: number;
      gid: number;
      pid: number;
      username: string;
      programmingProblems?: Array<{ gid: number; pid: number }>;
    }>;
  }) {
    return request.post('/ps/auto-task/subjective/review', data);
  },
};

export default cApi;
