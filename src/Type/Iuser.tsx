import {WithTranslation} from "react-i18next";

export enum Sex {
    Unknown = 0,
    Male = 1,
    Female = 2
}

export enum Role {
    SuperAdmin = 0,
    Admin = 1,
    User = 2
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

export interface IUserPropAvatar extends WithTranslation {
    id: number
    email: string
    username: string
}

export type loginInfor = {
    username: string,
    password: string
}

export type registerInfor = {
    username: string,
    password: string,
    email: string,
    emailCode: string
}

export type forgetInfor = {
    username: string,
    email: string,
    captchaId: string,
    captcha: string
}


