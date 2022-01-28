import {problemListQuery, thirdPartyLogin, updatePassWord} from '../../Type/types'
import {forgetInfo, loginInfo, profileInfo, registerInfo, verificationEmail} from "../../Type/types";
import request from "./request";
import {sleep} from "../Sleep";


export default {
    // Config
    async getTime() {
        return request.getTime('/site/getCopyright')
    },
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
    async updateProfile(data: profileInfo | updatePassWord) {
        return request.post('/user/updateProfile', data)
    },
    async sendVerificationEmail(data: verificationEmail) {
        return request.post('/user/sendVerificationEmail', data)
    },
    async resetPassword(data: any) {
        return request.post('/user/resetPassword', data)
    },
    async getProfile() {
        return request.get("/user/getProfile")
    },
    async getCaptcha() {
        return request.get("/user/getCaptcha")
    },
    async updateEmail(data: any) {
        return request.post("/user/updateEmail", data)
    },
    async isExist(data: any) {
        return request.get("/user/isExist", data)
    },
    // 第三方登录相关
    async thirdPartyLogin(data: thirdPartyLogin) {
        // await sleep(2000)
        // return Promise.resolve({
        //     thirdParty: "SDUCAS",
        //     sduRealName: "XXX",
        //     sduId: "2018XXXXXXXX",
        //     user: null,
        //     token: "1111111"
        // })
        return request.get('/user/thirdPartyLogin', data)
    },
    async thirdPartyUnbinding(data: { thirdParty: string }) {
        return request.get("/user/thirdPartyUnbinding", data)
    },
    //// 注册新账号并绑定已有账号
    async thirdPartyRegister(data: any) {
        return request.post("/user/thirdPartyRegister", data)
    },
    //// 绑定已有账号
    async thirdPartyBinding(data: any) {
        return request.post("/user/thirdPartyBinding", data)
    },
    // 文件相关
    async uploadFile(data: any) {
        return request.post('/filesys/uploadFiles', data, {
            headers: {"Content-Type": "multipart/form-data"}
        });
    },
    async getFileByMD5(data: { md5: string }) {
        return request.get("/filesys/queryByMd5", data)
    },
    // 公告相关
    async getAnnouncementList(data: any) {
        data['filter'] = "default"
        return request.get("/notice/list", data)
    },
    async getAnnouncement(data: any) {
        return request.get("notice/query", data)
    },
    // 提交相关
    async rejudge(data: string[]) {
        return request.post("/submit/rejudge", data)
    },
    // 题目相关
    async getProblemList(data: problemListQuery) {
        return request.get("/problem/list", data)
    },
}
