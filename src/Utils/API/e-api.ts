import axios, {AxiosResponse, AxiosRequestConfig} from "axios";
import {Get, Post, GetError, ProblemID, examID} from '../../Type/types'
import apiAddress from "./apiAddress";
import {ICreateSubmit, IGetProInfo} from "../../Type/IProblem";
import {store} from "../../Redux/Store";
import {message} from "antd";
import React from "react";

const baseUrl = apiAddress().EXAM_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
})
service.defaults.withCredentials = true

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    console.log(service.defaults.baseURL)
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

    // 获取题组信息
    async getExamGroupList(data: examID) {
        return request.get("/exam/" + data + "/getGroupList")
    },
    // 获取题目信息
    async getExamProblemList(examId: examID, groupId: React.Key) {
        return request.get("/exam/" + examId + "/group/" + groupId)
    },
    // 获取题目详细信息
    async getProInfo(data: IGetProInfo) {
        return request.get("/exam/getExamProblem", data)
    },
    // 提交代码
    async CreateSubmit(data: ICreateSubmit) {
        return request.post('exam/createSubmission', data)
    },
    // 获取考试信息
    async getExamInfo(data: examID) {
        return request.get('/exam/getInfo/' + data);
    },
    // 获取考试列表
    async getExamList(data: any) {
        return request.post("/exam/getInfo", data);
    },
    async setAnswerSheet(data: any, eid: examID, groupId: number){
        return request.post("/exam/" + eid + "/answerSheet/" + groupId, data)
    },
    async getAnswerSheet(eid: examID, groupId: number){
        return request.get("/exam/" + eid + "/answerSheet/" + groupId)
    },
    async ExamOver(data: {examId: number}){
        return request.get("/exam/userSubmit", data)
    }

}

// // 获取考试信息
// async getExamInfo(data: examID) {
//     return request.get('/exam/' + data.eid);
// },
// // 开始阅卷
// async startScoring() {
//     return request.get('/exam/marking');
// },
// // 获取题目列表
// async getExamProList(data: examID) {
//     return request.get('/exam/getList/' + data.eid);
// },
// // 获取题目信息
// async getProblemInfo(data: ProblemID) {
//     return request.get('/exam/getProblem/' + data.pid);
// },
