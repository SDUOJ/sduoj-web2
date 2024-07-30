import {
    forgetInfo,
    loginInfo,
    problemListQuery,
    profileInfo,
    registerInfo,
    thirdPartyLogin,
    updatePassWord,
    verificationEmail
} from '../../Type/types'
import request from "./request";
import apiAddress from "./apiAddress";


const cApi = {
    // Config
    async getCopyright() {
        return request.get<string>('/site/getCopyright');
    },


    // User
    async login(data: loginInfo) {
        return request.post('/user/login', data)
    },
    async emailLogin(data: { email: string, emailCode: string }) {
        return request.post('/user/emailLogin', data)
    },
    async logout() {
        return request.get('/user/logout')
    },
    async register(data: registerInfo) {
        return request.post('/user/register', data)
    },
    async forgetPassword(data: forgetInfo) {
        return request.post('/user/forgetPassword', data)
    },
    async getProfile() {
        return request.get("/user/getProfile")
    },
    async updateProfile(data: profileInfo) {
        return request.post('/user/updateProfile', data)
    },
    async updatePassword(data: updatePassWord) {
        return request.post('/user/updatePassword', data)
    },
    async updateEmail(data: any) {
        return request.post("/user/updateEmail", data)
    },
    async sendVerificationEmail(data: verificationEmail) {
        return request.post('/user/sendVerificationEmail', data)
    },
    async resetPassword(data: any) {
        return request.post('/user/resetPassword', data)
    },
    async getCaptcha() {
        return request.get("/user/getCaptcha")
    },
    async isExist(data: any) {
        return request.get("/user/isExist", data)
    },
    async queryParticipateContest() {
        return request.get("/user/queryParticipateContest")
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
        return request.get('/user/thirdPartyLogin', data)
    },
    async thirdPartyUnbinding(data: { thirdParty: string }) {
        return request.get("/user/thirdPartyUnbinding", data)
    },
    //// 注册新账号并绑定已有账号
    async thirdPartyRegister(data: any) {
        return request.post("/user/thirdPartyRegister", data)
    },
    //// 绑定已有账号
    async thirdPartyBinding(data: any) {
        return request.post("/user/thirdPartyBinding", data)
    },


    // 文件相关
    async uploadFile(data: any) {
        return request.post('/filesys/uploadFiles', data, {
            headers: {"Content-Type": "multipart/form-data"}
        });
    },
    async uploadSingleFile(data: any) {
        return request.post('/filesys/upload', data, {
            headers: {"Content-Type": "multipart/form-data"}
        });
    },
    async getFileByMD5(data: { md5: string }) {
        return request.get("/filesys/queryByMd5", data)
    },
    getFileDownloadUrl(id: string, name: string) {
        return apiAddress().CLIENT_SERVER + "/api/filesys/download/" + id + "/" + name
    },

    // 比赛相关
    async getContestList(data: any) {
        return request.get("/contest/list", data)
    },
    async invalidateContestSubmission(data: { submissionId: string, contestId: string }) {
        return request.get("/contest/invalidateSubmission", data)
    },
    async getUpcomingContest(data: any) {
        return request.get("/contest/queryUpcomingContest", data)
    },
    async getContestProblem(data: { contestId: string, problemCode: string }) {
        return request.get("/contest/queryProblem", data)
    },
    async getContestAcProblem(data: { contestId: string }) {
        return request.get("/contest/queryACProblem", data)
    },
    async participateContest(data: { contestId: string, password?: string }) {
        return request.post("/contest/participate", data)
    },
    async submitContestProblem(data: { contestId: string } & any) {
        return request.post("/contest/createSubmission", data)
    },
    async getContestInfo(data: { contestId: string }) {
        return request.get("/contest/query", data)
    },
    async getContestSubmissionList(data: any) {
        return request.get("/contest/listSubmission", data)
    },
    async rejudgeInContest(data: { contestId: string, submissionIds: string[] }) {
        return request.post("/contest/rejudge", data)
    },
    async getContestSubmissionInfo(data: { contestId: string, submissionId: string }) {
        return request.get("/contest/querySubmission", data)
    },
    async getRank(data: { contestId: string }) {
        return request.get("/contest/rank", data)
    },
    async submitInContest(data: { contestId: string } & any) {
        return request.post("/contest/createSubmission", data)
    },
    async getContestReport(data: any) {
        return request.post("/contest/comprehensiveReport", data)
    },


    // 比赛问答
    async createQuestion(data: { contestId: string, title: string, message: string }) {
        return request.post("/contest/createQuestion", data)
    },
    async replyQuestion(data: { contestId: string, message: string, rootId: string, parentId: string }) {
        return request.post("/contest/reply", data)
    },
    async deleteQuestion(data: { clarificationId: string }) {
        return request.get("/contest/delete", data)
    },
    async getQuestionList(data: { contestId: string }) {
        return request.get("/contest/listQuestion", data)
    },
    async getQuestionDetail(data: { clarificationId: string }) {
        return request.get("/contest/questionDetail", data)
    },
    async publicQuestion(data: { clarificationId: string }) {
        //// TODO 此处正确性未知
        return request.post("/contest/publicQuestion", data)
    },


    // 公告相关
    async getAnnouncementList(data: any) {
        data['filter'] = "default"
        return request.get("/notice/list", data)
    },
    async getAnnouncement(data: any) {
        return request.get("notice/query", data)
    },


    // 提交相关
    async rejudge(data: string[]) {
        return request.post("/submit/rejudge", data)
    },
    async getSubmissionInfo(data: { submissionId: string }) {
        return request.get("/submit/query", data)
    },
    async getSubmissionList(data: any) {
        return request.get("/submit/list", data)
    },
    async getACProblem() {
        return request.get("/submit/queryACProblem")
    },
    async invalidateSubmission(data: { submissionId: string }) {
        return request.get("/submit/invalidateSubmission", data)
    },
    async submit(data: {
        problemCode: string,
        judgeTemplateId: string,
        code?: string
        zipFileId?: string
    }) {
        return request.post("/submit/create", data)
    },


    // 题目相关
    async getProblemList(data: problemListQuery) {
        return request.get("/problem/list", data)
    },
    async getProblemInfo(data: { problemCode: string, descriptionId?: string }) {
        return request.get("/problem/query", data)
    },


    // 用户组相关
    async getGroupInfo(data: { groupId: string }) {
        return request.get("/group/query", data)
    },
    async getMyGroup() {
        return request.get("/group/my")
    },
    async getGroupList(data: any) {
        return request.get("/group/page", data)
    },
    async joinGroupApply(data: { groupId: string }) {
        return request.get("/group/apply", data)
    },
    async quitGroup(data: { groupId: string }) {
        return request.get("/group/quit", data)
    },


    // 题单相关
    async getProblemSetInfo(data: any) {
        return request.post("/ps/problem_set/info_c", data)
    },
    // 获取单个题目信息
    async getProblemSetProblem(data: any) {
        return request.post("/ps/problem_set/pro_info", data)
    },

    // 提交题目答案
    async submitProblemSetProblem(data: any) {
        return request.post("/ps/answer_sheet/answer", data)
    },
    // 获取答题卡信息
    async getProblemSetProblemAS(data: any) {
        return request.post("/ps/answer_sheet/info", data)
    },
    // 标记客观题选项
    async markObjectiveProblem(data: any) {
        return request.post("/ps/answer_sheet/mark", data)
    },
    // 标记题目
    async updateProblemSetProblemCollect(data: any) {
        return request.post("/ps/answer_sheet/collect", data)
    },

    // 编程题提交列表
    async getProblemSetSubmissionList(data: any) {
        return request.post("/ps/answer_sheet/submissionList", data)
    },
    // 编程题提交详情
    async getProblemSetSubmissionInfo(data: any) {
        return request.post("/ps/answer_sheet/submissionInfo", data)
    },
    // 题单交卷
    async finishProblemSet(data: any) {
        return request.post("/ps/answer_sheet/finish", data)
    },

    // 获取评阅列表
    async getJudgeList(data: any) {
        return request.post("/ps/judge/list", data)
    },
    // 获取评阅信息
    async getJudgeInfo(data: any) {
        return request.post("/ps/judge/info", data)
    },
    // 更新评阅信息
    async updateJudgeInfo(data: any) {
        return request.post("/ps/judge/add", data)
    },
    // 显示题单总结信息，用于显示 Rank
    async getProblemSummary(data: any) {
        return request.post("/ps/summary/summary", data)
    },
    // 获取榜单的题目预览数据
    async getProblemSetProPreview(data: any) {
        return request.post("/ps/summary/preview", data)
    },
    // 获取题单的标签列表
    async getProblemSetLabelList(data: any) {
        return request.post("/ps/problem_set/key", data)
    },
    // 获取题单列表
    async getProblemSetList(data: any) {
        return request.post("/ps/problem_set/search", data)
    },
    // 获取题单公开信息
    async getProblemSetPublic(data: any) {
        return request.post("/ps/problem_set/public", data)
    },

    //   ---- 公共数据集 -----
    // 新增一个公共数据
    async addPublicCheckpoints(data: any) {
        return request.post("/problem/appendCheckpoints", data)
    },
    // 列出题目的检查点
    async getPublicCheckpoints(data: { problemId: number }) {
        return request.get("/problem/listCheckpoints", data)
    },
    // 删除题目的检查点
    async delPublicCheckpoints(data: any) {
        return request.post("/problem/deleteCheckpoints", data)
    },

    // 新增一个公共数据
    async addPsPublicCheckpoints(data: any) {
        return request.post("/ps/answer_sheet/pbcp/add", data)
    },
    // 列出题目的检查点
    async getPsPublicCheckpoints(data: any) {
        return request.post("/ps/answer_sheet/pbcp/get", data)
    },
    // 删除题目的检查点
    async delPsPublicCheckpoints(data: any) {
        return request.post("/ps/answer_sheet/pbcp/del", data)
    },


    // 查询互评列表
    async getSMEList(data: any) {
        return request.get("/sme/", data)
    },
    // 提交互评结果
    async submitSME(data: any) {
        return request.post("/sme/", data)
    },
    // 查看互评结果
    async getSMEResult(data: any) {
        return request.get("/sme/results/", data)
    }
}

export default cApi;
