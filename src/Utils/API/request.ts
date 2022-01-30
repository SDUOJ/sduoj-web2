import apiAddress from "./apiAddress";
import axios, {AxiosRequestConfig} from "axios";
import {Get, GetError, Post} from "../../Type/types";
import {message} from "antd";

const baseUrl = apiAddress().CLIENT_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
})
service.defaults.withCredentials = true

const getTime: Get | GetError = async (url: string) => {
    try {
        const response = await service.get(url);
        switch (response.data.code) {
            case 0:
                return response.data.timestamp
            default:
                message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    } catch (e: any) {
        const response = e.response
        if (response === undefined) {
            message.error("服务器不可达")
            return Promise.reject("服务器不可达")
        }
        switch (response.data.code) {
            default:
                return Promise.reject(response.data.message)
        }
    }
}

const messageDisabledList = [
    "/user/getProfile",
    "/submit/queryACProblem"
]

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.get(url, {
            params, ...config
        });
        if (Math.abs(response.data.timestamp - Date.now()) > 60000) {
            window.location.replace("/v2/error/time")
            message.error("本地时间异常")
            return Promise.reject("本地时间异常")
        }
        switch (response.data.code) {
            case 0:
                return response.data.data
            default:
                message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    } catch (e: any) {
        const response = e.response
        if (response === undefined) {
            message.error("服务器不可达")
            return Promise.reject("服务器不可达")
        }
        switch (response.data.code) {
            default:
                if (messageDisabledList.indexOf(url) === -1)
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
        if (Math.abs(response.data.timestamp - Date.now()) > 60000) {
            window.location.replace("/v2/error/time")
            message.error("本地时间异常")
            return Promise.reject("本地时间异常")
        }
        switch (response.data.code) {
            case 0:
                return response.data.data
            default:
                message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    } catch (e: any) {
        const response = e.response
        if (response === undefined) {
            message.error("服务器不可达")
            return Promise.reject("服务器不可达")
        }
        switch (response.data.code) {
            default:
                if (messageDisabledList.indexOf(url) === -1)
                    message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
    }
}

export default {
    get,
    post,
    getTime
};