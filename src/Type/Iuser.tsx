import {WithTranslation} from "react-i18next";

export enum Sex {
    Unknown = 0,
    Male = 1,
    Female = 2
}

// export enum Role {
//     SuperAdmin = 0,
//     Admin = 1,
//     User = 2
// }

export type Role = "superadmin" | "admin" | "user"

export enum sex {
    boy = 0,
    girl = 1
}


export interface IUser {
    id: number
    student_id?: string
    sdu_id?: string
    username: string
    nickname?: string
    sex?: Sex
    email?: string
    roles: Role[]
}


export interface IUserPropCbk extends WithTranslation {
    ids?: number[]
    callback: any
    obj?: any
}


export interface IUserPropRoles extends WithTranslation {
    id: number
    roles: Role[]
    obj?: any
    data?: any
}

export interface IUserPropAvatar {
    id: number
    email: string
    username: string
}


export interface UserInfo{
    userId: string
    username: string
    nickname: string
    realName?: string
    email?: string | null
    studentId: string
    roles: Role[]
    sduId?: string | null
    groups?: string[]
    ipv4?: string
    userAgent?: string
    features?: any
    gender?:any
}

export interface UserState{
    isLogin: boolean
    userInfo?: UserInfo
}

export interface thirdPartyLoginDataSDUCAS{
    ticket: string
}

export type thirdPartyLoginType = "SDUCAS" | "QQ" | "WeChat"
export type thirdPartyLoginData = thirdPartyLoginDataSDUCAS


export interface thirdPartyLoginAction{
    type: thirdPartyLoginType
    data: thirdPartyLoginData
}

export interface thirdPartyLoginResponse{
    sduId: string
    sduRealName: string
    thirdParty: string
    token: string
    user: any
}

