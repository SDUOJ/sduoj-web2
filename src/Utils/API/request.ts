import apiAddress from "./apiAddress";
import axios, {AxiosRequestConfig} from "axios";
import {Get, GetError, Post} from "../../Type/types";
import {message} from "antd";
import {UrlPrefix} from "../../Config/constValue";

const baseUrl = apiAddress().CLIENT_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 1000 * 60 * 5, // 超时时间改为 5 分钟
})
service.defaults.withCredentials = true


const getZipFile: any = async (url: string, data: object, config?: AxiosRequestConfig, filename?: string) => {
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
    "/group/my",
    "/problem_set/upcoming"
]

const parseErrorMessage = (payload: any, fallback = "请求失败") => {
    if (payload === undefined || payload === null) return fallback;
    if (typeof payload === "string" && payload.trim() !== "") return payload.trim();
    if (typeof payload?.message === "string" && payload.message.trim() !== "") return payload.message.trim();
    if (typeof payload?.msg === "string" && payload.msg.trim() !== "") return payload.msg.trim();

    const detail = payload?.detail;
    if (typeof detail === "string" && detail.trim() !== "") return detail.trim();
    if (Array.isArray(detail) && detail.length > 0) {
        const first = detail[0];
        if (typeof first === "string" && first.trim() !== "") return first.trim();
        if (typeof first?.msg === "string" && first.msg.trim() !== "") return first.msg.trim();
    }
    if (typeof detail?.msg === "string" && detail.msg.trim() !== "") return detail.msg.trim();

    return fallback;
}

const dealResponse = async (resp: any, url: string) => {
    try {
        const response = await resp;
        localStorage.setItem('server-time', response.data.timestamp)
        if (Math.abs(response.data.timestamp - Date.now()) > 60000) {
            window.location.replace(UrlPrefix + "/error/time")
            message.error("本地时间异常")
            return Promise.reject("本地时间异常")
        }
        switch (response.data.code) {
            case 0:
                return response.data.data
            default:
                message.error(parseErrorMessage(response.data));
                return Promise.reject(parseErrorMessage(response.data))
        }
    } catch (e: any) {
        const response = e.response
        if (response === undefined) {
            // respect silence list for network unreachable as well
            if (messageDisabledList.indexOf(url) === -1)
                message.error("服务器不可达")
            return Promise.reject("服务器不可达")
        }
        if (response.status === 400) {
            const errorMsg = parseErrorMessage(response.data, "请求参数错误");
            message.error(errorMsg);
            return Promise.reject(errorMsg);
        }
        switch (response.data.code) {
            case 401:
                if (messageDisabledList.indexOf(url) === -1) {
                    let pos = window.location.href.indexOf(UrlPrefix)
                    let to = window.location.href.substring(pos).split("?")[0]
                    if (to !== "/login")
                        window.location.replace(UrlPrefix + "/login?to=" + to)
                    message.error(parseErrorMessage(response.data, "未登录或登录已过期"));
                }
                return Promise.reject(parseErrorMessage(response.data, "未登录或登录已过期"))
            default:
                const errorMsg = parseErrorMessage(response.data);
                if (messageDisabledList.indexOf(url) === -1)
                    message.error(errorMsg);
                return Promise.reject(errorMsg)
        }
    }
}

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    return await dealResponse(service.get(url, {
        ...{headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}}, params, ...config,
    }), url)
}

const post: Post | GetError = async (url: string, data: object, config?: AxiosRequestConfig) => {
    return await dealResponse(service.post(url, data, {
        ...{headers: {"Cache-Control": "no-cache, no-store, must-revalidate"}}, ...config
    }), url);
}

const request = {
    get,
    post,
    getZipFile
}
export default request;
