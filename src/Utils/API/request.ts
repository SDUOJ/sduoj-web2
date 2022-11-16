import apiAddress from "./apiAddress";
import axios, {AxiosRequestConfig} from "axios";
import {Get, GetError, Post} from "../../Type/types";
import {message} from "antd";
import {UrlPrefix} from "../../Config/constValue";

const baseUrl = apiAddress().CLIENT_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 10000,
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

const getZipFile: any = async (url: string, data: object, config?: AxiosRequestConfig, filename?:string) => {
    const response = await service.post(url, data, {
        ...config, responseType: 'blob'
    });
    try {
        let blob = new Blob([response.data], {type: 'application/zip'})
        let Url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = Url
        link.download = filename ?? `${Date.now()}-TestCase.zip`
        link.click()
        URL.revokeObjectURL(Url)
    } catch (e) {
        return Promise.reject(e)
    }
    return Promise.resolve()
}


const messageDisabledList = [
    "/user/getProfile",
    "/submit/queryACProblem",
    "/group/my"
]

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.get(url, {
            ...{headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}}, params, ...config,
        });
        if (Math.abs(response.data.timestamp - Date.now()) > 60000) {
            window.location.replace(UrlPrefix + "/error/time")
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
            ...{headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}}, ...config
        });
        if (Math.abs(response.data.timestamp - Date.now()) > 60000) {
            window.location.replace(UrlPrefix + "/error/time")
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
    getTime,
    getZipFile
};