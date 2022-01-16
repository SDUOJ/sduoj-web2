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

const get: Get | GetError = async (url: string, params?: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.get(url, {
            params, ...config
        });
        switch (response.data.code) {
            case 0:
                return response.data.data
            default:
                message.error(response.data.message);
                return null
        }
    } catch (e: any) {
        const response = e.response
        if (response == undefined) {
            message.error("后端不可达")
            return Promise.reject("后端不可达")
        }
        switch (response.data.code) {
            default:
                if(url !== "/user/getProfile")
                    message.error(response.data.message);
                return Promise.reject(response.data.message)
        }
        // TODO: Update Time
    }
}

const post: Post | GetError = async (url: string, data: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.post(url, data, {
            ...config
        });
        // console.log("post", response)
        switch (response.data.code) {
            case 0:
                message.success(response.data.message)
                return response.data.data
            default:
                message.error(response.data.message);
                return null
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

export default {
    get,
    post
};