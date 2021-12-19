import {
    Choice,
    ChoiceContent,
    ChoiceState,
    IGetProInfo,
    isChoiceContent,
    isProgramContent, JudgeTemplate,
    ProContent, ProgramContent, Submission, TestCase
} from "../../Type/IProblem";
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
    setAnswerSheet |
    cleanProInfo |
    setProgramSubmissionList |
    cleanExamInfo |
    cleanProList


export interface updateChoice {
    type: "updateChoice"
    examId: examID
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
    examId: examID
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

export interface cleanProInfo {
    type: "cleanProInfo"
}

export interface cleanExamInfo{
    type: "cleanExamInfo"
}

export interface cleanProList{
    type: "cleanProList"
}

export interface setProgramSubmissionList {
    type: "setProgramSubmissionList",
    data: Submission[]
}

function getAnswer(choice: Choice[], type: ChoiceState) {
    const res = []
    for (const x of choice) if (x.state == type) res.push(x.id)
    return res
}

export function genAnswerSheet(State: ExamState) {
    const groupInfo = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1]
    const proInfo: SProInfo[] = groupInfo.proList
    let res: any = []
    for (const x of proInfo) {
        if (x.content != undefined && isChoiceContent(x.content)) {
            const content: ChoiceContent = x.content
            res.push({
                index: x.index,
                answer: content != undefined ? getAnswer(content.choice, "used") : [],
                pass: content != undefined ? getAnswer(content.choice, "unused") : [],
                marked: x.flag
            })
        }
    }
    return res
}

export function getExamProblemListTodo(eid: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getExamGroupList(eid).then(function (resData: any) {
            if (resData != null) {
                // console.log("getExamGroupList", resData)
                let data: SProGroupInfo[] = []
                for (const x of resData) {
                    const proList: SProInfo[] = []
                    let cnt = 0
                    for (const y of x.problems) {
                        proList.push({
                            index: cnt,
                            score: y.problemScore,
                            flag: false,
                        })
                        cnt++;
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
        }).catch(()=>{
            dispatch({type:"cleanProList"})
        })
    }
}

export function getExamInfoTodo(examId: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getExamInfo(examId).then(function (resDate) {
            if (resDate != null) {
                const x: any = resDate
                const data = {
                    id: x.examId,
                    startTime: parseInt(x.gmtStart),
                    endTime: parseInt(x.gmtEnd),
                    title: x.examTitle,
                    participantNum: x.participantNum,
                    description: x.description.toString(),
                    userIsSubmit: x.userIsSubmit
                }
                dispatch({type: "setExamInfo", data: data})
            }
        }).catch(()=>{
            dispatch({type: "setExamInfo"})
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
                    let testCase: TestCase[] = []
                    for (const x of resData.problemCaseDTOList) {
                        testCase.push({
                            "inputData": x.input,
                            "outputData": x.output
                        })
                    }
                    let judgeTemplate: JudgeTemplate[] = []
                    for (const x of resData.judgeTemplates) {
                        judgeTemplate.push({
                            tid: x.id,
                            name: x.title
                        })
                    }
                    let markdown = resData.problemDescriptionDTO.markdownDescription
                    markdown = markdown.replace("$", " $ ")
                    markdown = markdown.replace("  $", " $")
                    markdown = markdown.replace("$  ", "$ ")
                    data = {
                        isLoad: true,
                        title: resData.problemTitle,
                        markdown: markdown,
                        testCase: testCase,
                        TimeLimit: resData.timeLimit,
                        MemoryLimit: resData.memoryLimit,
                        JudgeTemplate: judgeTemplate,
                        Submissions: [],
                        MaxSubmitNumber: resData.submitNum,
                        SumScore: resData.sumScore
                    }
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