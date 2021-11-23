import axios, {AxiosResponse, AxiosRequestConfig} from "axios";
import {Get, Post, GetError, ProblemID} from '../../Type/types'
import apiAddress from "./apiAddress";

const baseUrl = apiAddress().EXAM_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
})

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

        //    TODO: Update Time
    } catch (e: any) {
        console.log("999")
        console.log(e)
        switch (e.code) {
            case 429:
                //        TODO
                break;
            default:
            //        TODO
        }

        // TODO: Update Time
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

        //    TODO: Update Time
    } catch (e: any) {
        switch (e.data.code) {
            case 429:
                //        TODO
                break;
            default:
            //        TODO
        }

        // TODO: Update Time
    }
}

const request = {
    get,
    post
};

export default {

    // 获取题目信息
    async getPro(data: ProblemID) {
        return request.get('/');
    },

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
