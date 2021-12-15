import axios, {
    AxiosResponse, AxiosRequestConfig, CustomSuccessData
} from "axios";

import {
    checkPointData, examID,
    Get,
    GetError,
    groupInfo,
    groupListQuery,
    judgeTemplate,
    loginInfo,
    modifyProblemsCheckPoint,
    multiCheckpointFileUpload,
    Post,
    problemBasic,
    problemDescription,
    problemListQuery,
    query,
    studentBasic, updateUserStates,
    userListQuery
} from '../../Type/types'
import apiAddress from "./apiAddress";
import {store} from "../../Redux/Store";
import {message} from "antd";

const baseUrl = apiAddress().MANAGE_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
})
service.defaults.withCredentials = true

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.get(url, {
            params, ...config
        });
        switch (response.data.code) {
            case 0:
                return response.data.data
            case 429:
                //        TODO
                break;
            default:
                //        TODO
                break;
        }
    } catch (e: any) {
        const response = e.response
        if (response == undefined) {
            message.error("后端不可达")
            return Promise.reject("后端不可达")
        }
        switch (response.data.code) {
            default:
                message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    }
}

const post: Post | GetError = async (url: string, data: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.post(url, data, {
            ...config
        });
        switch (response.data.code) {
            case 0:
                return response.data.data
            case 429:
                //        TODO
                break;
            default:
                //        TODO
                break;
        }
    } catch (e: any) {
        const response = e.response
        if (response == undefined) {
            message.error("后端不可达")
            return Promise.reject("后端不可达")
        }
        switch (response.data.code) {
            default:
                message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    }
}

const request = {
    get,
    post
};

export default {
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
        return request.post('/manage/checkpoint/upload', data);
    },
    // checkpoint批量上传
    uploadCheckpointFiles: async function (data: multiCheckpointFileUpload[]) {
        return request.post('/manage/checkpoint/uploadFiles', data);
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
    getOneTemplate: async function (id: number) {
        return request.get('/manage/judgetemplate/query', {id});
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
    singleUpload: async function (data: { file: any }) {
        return request.post('/filesys/upload', data);
    },
    // 多文件上传
    multiUpload: async function (data: { files: any }) {
        return request.post('/filesys/uploadFiles', data);
    },
    // 用 md5 查文件
    checkMD5: async function (md5: string) {
        return request.get('/filesys/queryByMd5', {md5});
    },
    // 以zip包下载多个文件
    zipDownload: async function (data: {}) {
        return new Promise((resolve, reject) => {
            request.post<any>('filesys/zipDownload', data, {responseType: 'blob'}).then(ret => {
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
                    // navigator.msSaveBlob(blob, filename);
                }
            }, err => (reject(err)));
        })
    },
    /* ************ group ****************** */
    createGroup: async function (data: groupInfo) {
        return request.post('/manage/group/create', data);
    },
    updateGroup: async function (data: groupInfo) {
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
    // EXAM -----------------
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
    getChoiceProblem: async function (params: { problemCode: string }) {
        return request.get("/manage/exam/queryChoiceProblem", params)
    },
    // 选择题
    getChoiceList: async function (data: any) {
        return request.post("/manage/exam/choiceProblem/listChoiceProblem", data)
    },
    createChoiceProblem: async function (data: any) {
        return request.post("/manage/exam/choiceProblem/createChoiceProblem", data)
    },
    updateChoiceProblem: async function (data: any){
        return request.post("/manage/exam/choiceProblem/updateChoiceProblem", data)
    },
    getChoiceInfo: async function (data: string){
        return request.get("/manage/exam/choiceProblem/queryChoiceProblem?problemCode=" + data)
    }

}
