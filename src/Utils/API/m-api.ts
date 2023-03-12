import {
    checkPointData,
    examID,
    groupInfo,
    groupListQuery,
    judgeTemplate,
    loginInfo,
    modifyProblemsCheckPoint,
    problemBasic,
    problemDescription,
    problemListQuery,
    query,
    studentBasic,
    updateUserStates,
    userListQuery
} from '../../Type/types'
import {SubmissionQueryType} from "../../Type/IManage";

import request from "./request";
import {IAddCodesToHub} from "../../Type/IAnti-cheating";

const mApi = {
    // 配置相关
    async getCopyright() {
        return request.get('/site/getCopyright');
    },
    // ---------------------- 用户相关 ----------------------
    /* 通过组号获取比赛列表 */
    async getContestListByGroupId(params: query) {
        return request.get('/contest/list', params)
    },

    /* 通过组号获取组内学生 */
    async getStudentListByGroupId(params: groupListQuery) {
        return request.get('/group/query', params)
    },
    // 查询用户列表
    async getUserList(params: userListQuery) {
        return request.get('/manage/user/list', params);
    },
    // 更改用户信息
    async updateUserInfo(data: studentBasic) {
        return request.post('/manage/user/update', data);
    },
    // 更改用户密码
    async updateUserPasswd(data: loginInfo) {
        return request.post('/manage/user/update', data);
    },
    // 批量添加用户
    addUsers: async function (data: (studentBasic & { password: string })[]) {
        return request.post('/manage/user/addUsers', data);
    },
    // 删除用户
    deleteUsers: async function (data: string[]) {
        return request.post('/manage/user/delete', data);
    },
    // ---------------------- 题目相关 ----------------------
    // 查询题目列表
    getProblemList: async function (params: problemListQuery) {
        return request.get('/manage/problem/list', params);
    },
    // 查询题目
    getProblem: async function (params: { problemCode: string }) {
        return request.get('/manage/problem/query', params);
    },
    // 更新题目信息
    updateProblemInfo: async function (data: problemBasic) {
        return request.post('/manage/problem/update', data);
    },
    // 创建题目
    createProblem: async function (data: problemBasic) {
        return request.post('/manage/problem/create', data);
    },
    // ---------------------- 题面相关 ----------------------
    // 查询题目的描述列表
    getProblemDescriptionList: async function (params: { problemCode: string }) {
        return request.get('/manage/problem/queryDescriptionList', params);
    },
    // 查询题目描述
    getProblemDescription: async function (params: { descriptionId: number }) {
        return request.get('/manage/problem/queryDescription', params);
    },
    // 更新题面描述
    updateDescription: async function (data: problemDescription) {
        return request.post('/manage/problem/updateDescription', data);
    },
    // 创建新题面描述
    createDescription: async function (data: problemDescription) {
        return request.post('/manage/problem/createDescription', data);
    },
    deleteDescription: async function (params: { id: number }) {
        return request.get('/manage/problem/deleteDescription', params);
    },
    // ---------------------- 测试点相关 ----------------------
    // checkpoint单点上传
    uploadSingleCheckpoint: async function (data: checkPointData) {
        return request.post('/checkpoint/upload', data);
    },
    // checkpoint批量上传
    uploadCheckpointFiles: async function (data: any) {
        return request.post('/checkpoint/uploadFiles', data,
            {headers: {"Content-Type": "multipart/form-data"}}
        );
    },
    // 获取题目的checkpoint列表
    getCheckpointList: async function (problemCode: string) {
        return request.get('/manage/checkpoint/list', {problemCode});
    },
    // 获取checkpoint详情
    getCheckpointPreview: async function (checkpointId: number) {
        return request.get('/manage/checkpoint/query', {checkpointId});
    },
    // 全量更新题目的checkpoint
    updateProblemCheckpoints: async function (data: modifyProblemsCheckPoint) {
        return request.post('/manage/problem/update', data);
    },
    // ---------------------- 比赛相关 ----------------------
    // 获取比赛列表
    getContestList: async function (params: query) {
        return request.get('/manage/contest/page', params);
    },
    // 获取单个比赛详情
    getContest: async function (params: { contestId: number }) {
        return request.get('/manage/contest/query', params);
    },
    // TODO
    // 更新比赛信息
    updateContest: async function (data: {}) {
        return request.post('/manage/contest/update', data);
    },
    // 创建比赛
    createContest: async function (data: {}) {
        return request.post('/manage/contest/create', data);
    },
    // TODO
    // 综合报表
    exportComprehensive: async function (data: {}) {
        return new Promise((resolve, reject) => {
            request.post<any>('/manage/contest/exportComprehensiveReport', data, {responseType: 'blob'}).then(ret => {
                resolve(ret);
                const blob = new Blob([ret.data], {type: ret.headers['content-type']});
                const elink = document.createElement('a');
                const filename = new Date().getTime().toString();
                if ('download' in elink) {
                    elink.download = filename;
                    elink.href = URL.createObjectURL(blob);
                    elink.click();
                    URL.revokeObjectURL(elink.href);
                } else {
                    // window.navigator.msSaveBlob(blob, filename);
                }
            }, err => (reject(err)));
        })
    },
    // ----------------- 评测模板相关 -------------------
    // 查询单个评测模板
    getOneTemplate: async function (params: any) {
        return request.get('/manage/judgetemplate/query', params);
    },
    // 查询多页评测模板
    pageTemplateList: async function (params: groupListQuery) {
        return request.get('/manage/judgetemplate/page', params);
    },
    getJudgeTemplateList: async function (params: { type: number, problemCode: string }) {
        return request.get('/manage/judgetemplate/list', params);
    },
    // 创建评测模板
    createTemplate: async function (data: judgeTemplate) {
        return request.post('/manage/judgetemplate/create', data);
    },
    // 更新评测模板
    updateTemplate: async function (data: judgeTemplate) {
        return request.post('/manage/judgetemplate/update', data);
    },
    // 评测模板title右模糊匹配
    queryTemplateTitle: async function (title: string) {
        return request.get('/manage/judgetemplate/listByTitle', {title});
    },
    // ----------------- 评测模板相关 -------------------
    // 单文件上传
    // singleUpload: async function (data: { file: any }) {
    //     return request.post('/filesys/upload', data);
    // },
    // 多文件上传
    // multiUpload: async function (data: { files: any }) {
    //     return request.post('/filesys/uploadFiles', data);
    // },
    // 用 md5 查文件
    // checkMD5: async function (md5: string) {
    //     return request.get('/filesys/queryByMd5', {md5});
    // },
    // 以zip包下载多个文件
    zipDownload: async function (data: any, filename?: string) {
        return request.getZipFile("/filesys/zipDownload", data, {}, filename)
    },
    // 以较低地压缩率，较高的速度完成压缩
    zipDownloadFast: async function (data: any, filename?: string) {
        return request.getZipFile("/filesys/zipDownloadWithoutCompression", data, {}, filename)
    },
    /* ************ group ****************** */
    createGroup: async function (data: groupInfo) {
        return request.post('/manage/group/create', data);
    },
    updateGroup: async function (data: any) {
        return request.post('/manage/group/update', data);
    },
    getGroupDetail: async function (params: { groupId: number }) {
        return request.get('/manage/group/query', params);
    },
    getGroupList: async function (params: groupInfo) {
        return request.get('/manage/group/page', params);
    },
    updateUserStatus: async function (data: updateUserStates) {
        return request.post('/manage/group/updateUserStatus', data);
    },
    addUsersToGroup: async function (data: { groupId: number, usernames: string[] }) {
        return request.post('/manage/group/addUser', data);
    },
    deleteGroup: async function (params: { groupId: number }) {
        return request.get('/manage/group/delete', params);
    },
    queryGroupTitle: async function (params: { title: string }) {
        return request.get('/manage/group/listByTitle', params);
    },
    /* ************ EXAM ****************** */
    getExamList: async function (data: any) {
        return request.post("/manage/exam/getInfo", data);
    },
    getExamInfo: async function (examId: examID) {
        return request.get("/manage/exam/getInfo/" + examId)
    },
    createExam: async function (data: any) {
        return request.post("/manage/exam/create", data)
    },
    updateExam: async function (data: any) {
        return request.post("/manage/exam/update", data)
    },
    judgeExam: async function (examId: examID) {
        return request.get("/manage/exam/judge/" + examId)
    },
    getExamSubmission: async function (data: SubmissionQueryType & { examId: examID }) {
        return request.post("/manage/exam/querySubmissionList", data)
    },
    /* ************ 选择题 ****************** */
    getChoiceList: async function (data: any) {
        return request.post("/manage/exam/choiceProblem/listChoiceProblem", data)
    },
    createChoiceProblem: async function (data: any) {
        return request.post("/manage/exam/choiceProblem/createChoiceProblem", data)
    },
    updateChoiceProblem: async function (data: any) {
        return request.post("/manage/exam/choiceProblem/updateChoiceProblem", data)
    },
    getChoiceInfo: async function (data: string) {
        return request.get("/manage/exam/choiceProblem/queryChoiceProblem?problemCode=" + data)
    },
    getChoiceProblem: async function (params: { problemCode: string }) {
        return request.get("/manage/exam/choiceProblem/queryChoiceProblem", params)
    },
    /* ************ 公告 ****************** */
    createAnnouncement: async function (data: any) {
        return request.post("/manage/notice/create", data)
    },
    updateAnnouncement: async function (data: any) {
        return request.post("/manage/notice/update", data)
    },
    async getAnnouncementList(data: any) {
        data['filter'] = "default"
        return request.get("/manage/notice/list", data)
    },
    deleteAnnouncement: async function (data: any) {
        return request.get("/manage/notice/delete", data)
    },
    // ----------------- 查重相关 -------------------
    // 批量添加代码到代码仓库
    async addCodesToHub(data: IAddCodesToHub[]) {
        return request.post("/manage/codesim/-", data)
    },

    // ----------------- 主观题相关 -------------------
    // async getSubjectiveList(data: any[]) {
    //     return request.get("/manage/subjectiveproblem/list", data)
    // },
    // async createSubjective(data: any) {
    //     return request.post("/manage/subjectiveproblem/create", data)
    // },
    // async updateSubjective(data: any) {
    //     return request.post("/manage/subjectiveproblem/update", data)
    // },
    // async getSubjectiveInfo(data: any) {
    //     return request.get("/manage/subjectiveproblem/query", data)
    // },

    // ----------------- 题单相关 -------------------
    // async getProblemSetList(data: any) {
    //     return request.post("/manage/problemset/list", data)
    // },
    // async createProblemSet(data: any){
    //     return request.post("/manage/problemset/create", data)
    // },
    // async updateProblemSet(data: any){
    //     return request.post("/manage/problemset/update", data)
    // },
    // async getProblemSetInfo(data: any){
    //     return request.get("/manage/problemset/query", data)
    // },
    // -------------- 题单中的题组相关 ------------------
    // async getProblemSetGroupList(data: any){
    //     return request.get("", data)
    // },
    // async createProblemSetGroup(data: any){
    //     return request.post("/manage/problemset/addProblemGroup", data)
    // },
    // async updateProblemSetGroup(data: any){
    //     return request.post("/manage/problemset/updateProblemGroup", data)
    // },
    // async getProblemSetGroupInfo(data: any){
    //     return request.get("/manage/problemset/queryProblemGroup", data)
    // },
    // async deleteProblemSetGroup(data: any){
    //     return request.post("/manage/problemset/deleteProblem", data)
    // },
    // async updateOrderProblemSetGroup(data: any){
    //     return request.post("/manage/problemset/updateOrder", data)
    // },
    // -------------- 新版题单组件相关 ------------------
    async createProblemGroup(data: any) {
        return request.post("/ps/group/add", data)
    },
    async editProblemGroup(data: any) {
        return request.post("/ps/group/edit", data)
    },
    async getProblemGroupInfo(data: any) {
        return request.post("/ps/group/info", data)
    },
    async getProblemGroupList(data: any) {
        return request.post("/ps/group/list", data)
    },
    async getProblemGroupSearch(data: any) {
        return request.post("/ps/group/search", data)
    },

    async createObjective(data: any) {
        return request.post("/ps/objective/add", data)
    },
    async editObjective(data: any) {
        return request.post("/ps/objective/edit", data)
    },
    async getObjective(data: any) {
        return request.post("/ps/objective/info", data)
    },

    async createSubjective(data: any) {
        return request.post("/ps/subjective/add", data)
    },
    async editSubjective(data: any) {
        return request.post("/ps/subjective/edit", data)
    },
    async getSubjective(data: any) {
        return request.post("/ps/subjective/info", data)
    },

    async getProblemSetList(data: any) {
        return request.post("/ps/problem_set/list", data)
    },
    async getProblemSetInfo(data: any) {
        return request.post("/ps/problem_set/info", data)
    },
    async createProblemSet(data: any) {
        return request.post("/ps/problem_set/add", data)
    },
    async editProblemSet(data: any) {
        return request.post("/ps/problem_set/edit", data)
    },

    // 公共数据集相关
    // 更新公共数据集测试点信息
    async updatePublicCheckpoints(data: any) {
        return request.post("/manage/checkpoint/updateCheckpoints", data)
    },
    // 重新排序测试点
    async reArrangeCheckpoints(data: any) {
        return request.post("/manage/problem/rearrangeCheckpoints", data)
    }

}

export default mApi;
