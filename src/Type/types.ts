import {
    AxiosResponse, AxiosRequestConfig, CustomSuccessData
} from "axios";
import {Sex, sex} from "./Iuser";
import React from "react";

export interface Get {
    <T>(url: string, params?: object, config?: AxiosRequestConfig): Promise<CustomSuccessData<T>>;
}

export interface Post {
    <T>(url: string, data: object, config?: AxiosRequestConfig): Promise<CustomSuccessData<T>>
}

export interface GetError {
    (url: string, data?: object, config?: AxiosRequestConfig): void
}

export enum rolesInString {
    S = 'superadmin',
    A = 'admin',
    U = 'user'
}

export interface query {
    pageNow: number,
    pageSize: number,
    sortBy?: string
}

export interface studentBasic {
    username: string,
    nickname?: string,
    email?: string,
    studentId?: number | string,
    emailVerified?: boolean,
    roles: rolesInString[],
    features?: {
        banThirdParty: any,
        banEmailUpdate: any
    }
}

export interface functionTemplate {
    judgeTemplateId: number,
    isShowFunctionTemplate: number,
    functionTemplate?: string,
    initialTemplate?: string
}

export interface problemBasic {
    problemCode: string,
    isPublic?: boolean,
    problemTitle?: string,
    source?: string,
    languages?: string[],
    memoryLimit?: string | number,
    timeLimit?: string | number,
    defaultDescriptionId?: number,
    judgeTemplates?: number[],
    managerGroups?: number[],
    functionTemplates?: functionTemplate[]
}

export interface problemDescription {
    problemCode?: string,
    id?: string | number
    title?: string,
    markdownDescription?: string
    isPublic?: number
}

export interface checkPointData {
    input: string,
    output: string,
    mode: string
}

export interface multiCheckpointFileUpload {
    files: any[],
    mode: string
}

export interface modifyProblemsCheckPoint {
    problemCode: string,
    checkPoints: {
        checkpointId: string | number,
        checkPointScore: number
    }[],
    checkPointCases: string[]
}

export type problemListQuery = query & {
    ascending?: boolean,
    remoteOj?: any
}

export type groupListQuery = query & {
    title?: string
}

export type userListQuery = query & {
    username: string,
    studentId?: number | string,
    phone?: number | string,
    email?: string,
    sduld?: any,
    searchKey?: string
}

export interface judgeTemplate {
    // TODO
    type: number,
    title: string,
    shellScript: string,
    zipFileId: number | string,
    acceptFileExtensions: string[],
    comment: string,
}

export type loginInfo = {
    username: string,
    password: string
}

export type registerInfo = {
    username: string,
    password: string,
    email: string,
    emailCode: string
}

export interface groupInfo {
    openness: number,
    title: string,
    description: string,
    markdown: string,
    groupId?: number,
    features?: {
        isAbleQuit: boolean
    }
}

export type updateUserStates = {
    groupId: number,
    userIds: number[],
    status: number
}

export type forgetInfo = {
    username: string,
    email: string,
    captchaId: string,
    captcha: string
}

export type profileInfo = {
    nickname: string,
    phone: string,
    gender: Sex,
    studentId: number
}

export type verificationEmail = {
    email: string,
    captcha: string,
    captchaId: string
}

export type updatePassWord = {
    password: string,
    newPassword: string
}


export type examID = React.Key


export type ProblemID = {
    pid: string
}


export type thirdPartyLogin = {
    thirdParty: string
    ticket: string
}