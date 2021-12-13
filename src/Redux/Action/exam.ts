import {ChoiceState} from "../../Type/IProblem";
import {examID} from "../../Type/types";
import {Dispatch} from "react";
import eApi from "Utils/API/e-api"
import {ExamState, SExamInfo} from "../../Type/IExam";
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
    setExamID |
    setExamInfo


export interface updateChoice {
    type: "updateChoice"
    ChoiceID: string
    ChoiceState: ChoiceState
}

export interface updateTop {
    type: "updateTop"
    topIndex: number
}

export interface flipFlag {
    type: "flipFlag"
}

export interface setProList {
    type: "setProList"
}

export interface setExamID {
    type: "setExamID"
    ExamID: examID
}

export interface setExamInfo {
    type: "setExamInfo"
    data: SExamInfo
}




export function getExamProblemListTodo(eid: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        eApi.getExamProblemList(eid).then(function (resData: any) {
            if (resData != null) {
                console.log("123", resData)

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


