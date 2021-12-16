import {ProContent, ProType} from "./IProblem";
import {Badge} from "antd";
import React from "react";
import {groupSelection} from "./Igroup";

export interface SExamInfo {
    id: string
    startTime: number       // 开始时间
    endTime: number         // 结束时间
    title: string           // 考试标题
    description?: string    // 考试描述
    participantNum?: number // 考试人数
    userIsSubmit?: number  // 用户已提交
}

export interface SExamManageInfo {
    id: string
    startTime: number       // 开始时间
    endTime: number         // 结束时间
    title: string           // 考试标题
    manageGroup: string
    owner: string
}

export interface SProInfo {
    index: number                       // 在本场考试中的题号
    score: number                       // 题目分数
    flag: boolean                       // 是否标记
    content?: ProContent                // 题目内容
}

export interface SProGroupInfo {
    index: number
    title: string
    previous: number
    type: ProType                       // 题目类型
    groupStart: number
    groupEnd: number
    proList: SProInfo[]
}

export interface ExamListType {
    examId: string
    examTitle: string
    gmtStart: string
    gmtEnd: string
    participantNum: number
}


export interface ExamState {
    ExamInfoLoad: boolean               // 考试信息是否已加载
    examInfo?: SExamInfo                // 考试信息

    ProListLoad: boolean                // 题目信息是否已加载
    proGroupInfo?: SProGroupInfo[]      // 题组信息

    TopGroupIndex: number               // 顶部题组ID
    TopProblemIndex: number             // 顶部问题ID
    AnswerSheetLoad: boolean[]          // 答题卡是否已经加载
}

export interface IUserExamInfo {
    name?: string                       // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}

export interface GroupAnswerSheet{
    problemGroupId: number
    problemAnswer: ProblemAnswerSheet[]
}

export interface ProblemAnswerSheet{
    index: number
    answer: string[]
    pass: string[]
    marked: boolean
    choice: string[]
}

