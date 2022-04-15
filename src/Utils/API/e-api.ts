import {examID} from '../../Type/types'
import {ICreateSubmit, IGetProInfo} from "../../Type/IProblem";

import React from "react";

import request from "./request";

export default {

    // 获取题组信息
    async getExamGroupList(data: examID, reportNode: boolean = false) {
        return request.get("/exam/getGroupList", {examId: data, reportMode: reportNode})
        // return request.get("/exam/" + data + "/getGroupList")
    },
    // 获取题目详细信息
    async getProInfo(data: IGetProInfo, reportMode: boolean = false) {
        return request.get("/exam/getExamProblem", {...data, reportMode: reportMode})
    },
    // 获取答题卡信息
    async getAnswerSheet(eid: examID, groupId: React.Key, reportMode: boolean = false) {
        return request.get("/exam/getAnswerSheet", {examId: eid, groupId: groupId, reportMode: reportMode})
    },
    async getSubmission(examId: examID, submissionId: string, reportMode: boolean = false) {
        return request.get("/exam/getSubmission/", {examId: examId, submissionId: submissionId, reportMode})
    },
    // 提交代码
    async CreateSubmit(data: ICreateSubmit) {
        return request.post('/exam/createSubmission', data)
    },
    // 获取考试信息
    async getExamInfo(data: examID) {
        // await sleep(1000)
        // return request.get('/exam/getInfo/' + data);
        return request.get('/exam/getInfo', {examId: data});
    },
    // 获取考试列表
    async getExamList(data: any) {
        // return request.post("/exam/getInfo", data);
        return request.post("/exam/getInfos", data);
    },
    async setAnswerSheet(data: any, eid: examID, groupId: React.Key) {
        return request.post("/exam/submitAnswerSheet", {
            examId: eid,
            problemGroupId: groupId,
            ...data
        })
    },
    async ExamOver(data: { examId: number }) {
        return request.get("/exam/userSubmit", data)
    },

    // 获取提交列表
    async getSubmissionList(data: { examId: examID, problemGroup: number, problemIndex: number }) {
        return request.post("/exam/getSubmissionList", data)
    }
}
