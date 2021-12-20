import moment from "moment";
import React from "react";
import {SExamInfo, SExamManageInfo} from "./IExam";


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
    examDescription: string
}

export interface examDataType {
    examProblemListInfo: examProblemListType[]
    examProblemGroupInfo: examProblemGroupType[]
    examBasicInfo: examBasicType
}

export interface ManageState {
    examData: examDataType
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

export interface SubmissionQueryType {
    username?: string,
    judgeResult?: string,
    pageNow: number,
    pageSize: number,
    sortBy?: string,
    ascending?: string,
    problemCode?: string
}

export const genNumberList = (data: any) => {
    let res = []
    for (const x of data) res.push(x.id)
    return res
}

export const genAnswerList = (data: any) => {
    let res = []
    for (let i = 0; i < data.length; i++)
        res.push(String.fromCharCode('A'.charCodeAt(0) + i))
    return res
}

export const genEditableList = (data: any) => {
    let res = []
    for (let i = 0; i < data.length; i++)
        res.push(i)
    return res
}