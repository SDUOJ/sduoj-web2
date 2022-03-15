import {examID} from '../../Type/types'
import {ICreateSubmit, IGetProInfo} from "../../Type/IProblem";

import React from "react";

import request from "./request";

export default {

    // 获取题组信息
    async getExamGroupList(data: examID) {
        return request.get("/exam/" + data + "/getGroupList")
    },
    // 获取题组信息
    // async getExamProblemList(examId: React.Key, groupId: React.Key) {
    //     return request.get("/exam/" + examId + "/group/" + groupId)
    // },
    // 获取题目详细信息
    async getProInfo(data: IGetProInfo) {
        return request.get("/exam/getExamProblem", data)
    },
    // 提交代码
    async CreateSubmit(data: ICreateSubmit) {
        return request.post('/exam/createSubmission', data)
    },
    // 获取考试信息
    async getExamInfo(data: examID) {
        // await sleep(1000)
        return request.get('/exam/getInfo', {examId: data});
    },
    // 获取考试列表
    async getExamList(data: any) {
        return request.post("/exam/getInfos", data);
    },
    async setAnswerSheet(data: any, eid: examID, groupId: React.Key){
        return request.post("/exam/" + eid + "/answerSheet/" + groupId, data)
    },
    async getAnswerSheet(eid: examID, groupId: React.Key){
        return request.get("/exam/" + eid + "/answerSheet/" + groupId)
    },
    async ExamOver(data: {examId: number}){
        return request.get("/exam/userSubmit", data)
    },
    async getSubmissionList(data: {examId: examID, problemGroup: number, problemIndex: number}){
        return request.post("/exam/getSubmissionList", data)
    },
    async getSubmission(examId: examID, submissionId: string){
        return request.get("/exam/" + examId + "/submission/" + submissionId)
    }
}
