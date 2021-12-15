import {Choice, ChoiceContent, ChoiceState, IGetProInfo, ProContent} from "../../Type/IProblem";
import {examID} from "../../Type/types";
import React, {Dispatch} from "react";
import eApi from "Utils/API/e-api"
import {ExamState, ProblemAnswerSheet, SExamInfo, SProGroupInfo, SProInfo} from "../../Type/IExam";
import {ConfigState} from "../../Type/IConfig";
import {UserState} from "../../Type/Iuser";
import cookie from "react-cookies";
import {testLoginTodo, userGetProfileTodo} from "./user";
import {message} from "antd";
import CApi from "../../Utils/API/c-api";
import moment from "moment";
import {groupSelection} from "../../Type/Igroup";


export type ExamAction =
    updateChoice |
    updateTop |
    flipFlag |
    setProList |
    setExamInfo |
    setProInfo |
    setAnswerSheet


export interface updateChoice {
    type: "updateChoice"
    ChoiceID: string
    ChoiceState: ChoiceState
}

export interface updateTop {
    type: "updateTop"
    topProIndex: number
    topGroupIndex: number
}

export interface flipFlag {
    type: "flipFlag"
}


export interface setProList {
    type: "setProList"
    data: SProGroupInfo[]
}

export interface setExamInfo {
    type: "setExamInfo"
    data: SExamInfo
}

export interface setProInfo {
    type: "setProInfo",
    groupId: number
    proId: number
    data: ProContent | undefined
}

export interface setAnswerSheet {
    type: "setAnswerSheet",
    data: ProblemAnswerSheet[]
    problemGroupId: number
}

function getAnswer(choice: Choice[], type: ChoiceState) {
    const res = []
    for (const x of choice) if (x.state == type) res.push(x.id)
    return res
}

function genAnswerSheet(State: ExamState) {
    const groupInfo = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1]
    const proInfo: SProInfo[] = groupInfo.proList
    let res: any = []
    for (const x of proInfo) {
        const content: ChoiceContent = x.content as ChoiceContent
        res.push({
            index: x.index,
            answer: content != undefined && content.isLoad ? getAnswer(content.choice, "used") : [],
            pass: content != undefined && content.isLoad ? getAnswer(content.choice, "unused") : [],
            marked: x.flag
        })
    }
    return res
}

export function UpdateChoiceTodo(examId: examID, ChoiceID: string, ChoiceState: ChoiceState) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        eApi.setAnswerSheet({
            problemAnswer: genAnswerSheet(EState)
        }, examId, EState.TopProblemIndex - 1).then((resData: any) => {
            if (resData != null) {
                dispatch({
                    type: "updateChoice",
                    ChoiceID: ChoiceID,
                    ChoiceState: ChoiceState
                })
            }
        })
    }
}

export function FlipFlagTodo(examId: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        eApi.setAnswerSheet({
            problemAnswer: genAnswerSheet(EState)
        }, examId, EState.TopProblemIndex - 1).then((resData: any) => {
            if (resData != null) {
                dispatch({
                    type: "flipFlag",
                })
            }
        })
    }
}

export function getExamProblemListTodo(eid: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getExamGroupList(eid).then(function (resData: any) {
            if (resData != null) {
                let data: SProGroupInfo[] = []
                for (const x of resData) {
                    const proList: SProInfo[] = []
                    for (const y of x.problems) {
                        proList.push({
                            index: y.index,
                            score: y.problemScore,
                            flag: false,
                        })
                    }
                    data.push({
                        index: x.index,
                        title: x.title,
                        previous: x.previous,
                        type: x.type,
                        groupStart: parseInt(x.groupStart),
                        groupEnd: parseInt(x.groupEnd),
                        proList: proList
                    })
                }
                // 更新当前目录
                dispatch({type: "setProList", data: data})
            }
        })
    }
}

export function getExamInfoTodo(examId: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getExamInfo(examId).then(function (resDate) {
            if (resDate != null) {
                console.log(resDate)
                const x: any = resDate
                const data = {
                    id: x.examId,
                    startTime: parseInt(x.gmtStart),
                    endTime: parseInt(x.gmtEnd),
                    title: x.examTitle,
                    participantNum: x.participantNum,
                    description: x.description.toString()
                }
                dispatch({type: "setExamInfo", data: data})
            }
        })
    }
}

export function getProblemTodo(data: IGetProInfo) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const State: ExamState = getState().ExamReducer
        const groupId = data.groupIndex
        const proId = data.problemIndex
        eApi.getProInfo(data).then((resData: any) => {
            if (resData != null) {
                const type = (State.proGroupInfo as SProGroupInfo[]) [State.TopGroupIndex - 1].type
                let data: ProContent | undefined = undefined
                if (type == "Program") {

                }
                if (type == "SingleChoice" || type == "MultipleChoice") {
                    let choice: Choice[] = []
                    for (const x of Object.keys(resData.description.choice)) {
                        choice.push({
                            id: x,
                            content: resData.description.choice[x],
                            state: "init"
                        })
                    }
                    data = {
                        isLoad: true,
                        content: resData.description.content,
                        choice: choice
                    }
                }
                dispatch({
                    type: "setProInfo",
                    groupId: groupId,
                    proId: proId,
                    data: data
                })
            }
        })
    }
}

export function getAnswerSheetTodo(eid: examID, groupId: number) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getAnswerSheet(eid, groupId).then((resData: any) => {
            if (resData != null) {
                dispatch({
                    type: "setAnswerSheet",
                    data: resData.problemAnswer,
                    problemGroupId: groupId
                })
            }
        })
    }
}