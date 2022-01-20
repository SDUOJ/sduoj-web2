import {ProContent, ProType} from "./IProblem";
import React from "react";
import moment from "moment";

// 考试基本信息
export interface SExamInfo {
    id: string
    startTime: number       // 开始时间
    endTime: number         // 结束时间
    title: string           // 考试标题
    description?: string    // 考试描述
    participantNum?: number // 考试人数
    userIsSubmit?: number  // 用户已提交
    isScoreVisible?: boolean
    isSubmissionScoreVisible?: boolean
}

// 用于 M端 考试信息
export interface SExamManageInfo {
    id: string
    startTime: number       // 开始时间
    endTime: number         // 结束时间
    title: string           // 考试标题
    manageGroup: string
    owner: string
    userIsSubmit?: number
}

// 单个题目信息
export interface SProInfo {
    index: number                       // 在本场考试中的题号
    score: number                       // 题目分数
    flag: boolean                       // 是否标记
    content?: ProContent                // 题目内容
}

// 题组信息
export interface SProGroupInfo {
    index: number
    title: string
    previous: number
    type: ProType                       // 题目类型
    groupStart: number
    groupEnd: number
    proList: SProInfo[]
}

// C端考试信息
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


// 考生数据类型
export interface IUserExamInfo {
    name?: string                       // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}

// 单个题组答题卡数据
export interface GroupAnswerSheet {
    problemGroupId: number
    problemAnswer: ProblemAnswerSheet[]
}

// 单个问题答题卡数据
export interface ProblemAnswerSheet {
    index: number
    answer: string[]
    pass: string[]
    marked: boolean
    choice: string[]
}

export type problemGroupProType = "single" | "multi" | "program"
export const ProGroupTypeStF: any = {"Program": "program", "MultipleChoice": "multi", "SingleChoice": "single"}
export const ProGroupTypeFtS: any = {"program": "Program", "multi": "MultipleChoice", "single": "SingleChoice"}

export interface examProblemType {
    id: React.Key
    ProblemCode?: string
    ProblemScore?: number
    ProblemAlias?: string
    ProblemDescription?: string
    ProblemSubmitNumber?: number
}

export interface examProblemListType {
    groupId: React.Key
    proList: examProblemType[]
    problemInfo: examProblemInfo[]
    checkedProblemCode: string[]
}

export interface examProblemGroupType {
    id: React.Key
    ProblemGroupName?: string                   // 题组名
    ProblemGroupType?: problemGroupProType      // 题组题型        【select】
    ProblemGroupStartEndTime?: moment.Moment[]  // 题组开始时间     【Date】
    ProblemGroupPremise?: React.Key             // 题组开始先决条件  【select】
    ProblemGroupSumScore?: number               // 题组总分数
}

export interface examUserType {
    ManageGroup?: React.Key
    ParticipatingGroup?: React.Key[]
}

export interface examBasicType {
    examTitle: string,
    examStartEndTime: moment.Moment[],
    examDescription: string,
    isScoreVisible?: boolean,
    isSubmissionScoreVisible?: boolean
}

export interface examDataType {
    examProblemListInfo: examProblemListType[]
    examProblemGroupInfo: examProblemGroupType[]
    examBasicInfo: examBasicType
}

export interface examProblemInfo {
    problemCode: string
    problemDescription?: any
}

export interface examProblemDescription {
    id: string
    isPublic: number
    problemCode: string
    problemId: string
    title: string
    userId: string
    username: string
    voteNum: number
}