import axios, {
    AxiosResponse, AxiosRequestConfig
} from "axios";

import {
    Get,
    Post,
    GetError
} from '../../Type/types'
import apiAddress from "./apiAddress";
import {forgetInfo, loginInfo, profileInfo, registerInfo, resetPassWord, verificationEmail} from "../../Type/types";


const baseUrl = apiAddress().CLIENT_SERVER + '/api'

const service = axios.create({
    baseURL: baseUrl,
    timeout: 1000,
})

const get : Get |  GetError = async (url: string, params?: object, config?:AxiosRequestConfig) => {
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
    } catch (e:any) {
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

const post : Post | GetError = async (url: string, data: object, config?:AxiosRequestConfig) => {
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
    } catch (e:any) {
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
        return request.post('user/sendVerificationEmail', data)
    },
    async resetPassword(data: resetPassWord) {
        return request.post('user/eressetPassword', data)
    }
}
