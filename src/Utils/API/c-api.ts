import axios, {
    AxiosResponse, AxiosRequestConfig
} from "axios";

import {
    Get,
    Post,
    GetError, thirdPartyLogin
} from '../../Type/types'
import apiAddress from "./apiAddress";
import {forgetInfo, loginInfo, profileInfo, registerInfo, resetPassWord, verificationEmail} from "../../Type/types";
import {message} from "antd";
import {store} from "../../Redux/Store";


const baseUrl = apiAddress().CLIENT_SERVER + '/api'

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
        // TODO: Update Time
    }
}

const post: Post | GetError = async (url: string, data: object, config?: AxiosRequestConfig) => {
    try {
        const response = await service.post(url, data, {
            ...config
        });
        console.log("post", response)
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

const request = {
    get,
    post
};

export default {
    // Config
    async getCopyright() {
        return request.get<string>('/site/getCopyright');
    },

    // User
    async login(data: loginInfo) {
        return request.post('/user/login', data)
    },
    async logout() {
        return request.get('/user/logout')
    },
    async register(data: registerInfo) {
        return request.post('/user/register', data)
    },
    async forgetPassword(data: forgetInfo) {
        return request.post('/user/forgetPassword', data)
    },
    async updateProfile(data: profileInfo) {
        return request.post('/user/updateProfile', data)
    },
    async sendVerificationEmail(data: verificationEmail) {
        return request.post('/user/sendVerificationEmail', data)
    },
    async resetPassword(data: resetPassWord) {
        return request.post('/user/resetPassword', data)
    },
    async thirdPartyLogin(data: thirdPartyLogin) {
        return request.get('/user/thirdPartyLogin', data)
    },
    async getProfile() {
        return request.get("/user/getProfile")
    }
}
