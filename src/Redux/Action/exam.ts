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


export function getExamProblemListTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        eApi.getExamProblemList(EState.examId as examID).then(function (resDate) {

        })
    }
}

export function getExamInfoTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        eApi.getExamInfo(EState.examId as examID).then(function (resDate) {
            console.log(resDate)
            if (resDate != null) {
                dispatch({type: "setExamInfo", data: resDate})
            }
        })
    }
}


export function EWaitInitTodo(eid: examID) {
    return (dispatch: Dispatch<any>, getState: any) => {
        dispatch({type: "setExamID", ExamID: eid})

        // 判断当前是否处于登录状态，若此时未登录，会删除 isLogin
        if(cookie.load("SESSION") != undefined){
            CApi.getProfile().then((resData) => {
                if (resData !== null) {
                    dispatch({type: "userLogin"})
                    // 当前用户处于已登录的状态
                    // 获取统一身份认证的信息
                    const thirdUserInfoStr = sessionStorage.getItem("SDU-UserInfo")
                    if (thirdUserInfoStr != undefined) {
                        const thirdUserInfo = JSON.parse(thirdUserInfoStr)
                        // 更新当前用户信息
                        dispatch({type: "setUserInfo", data: thirdUserInfo})
                        // 获取考试信息
                        dispatch(getExamInfoTodo())
                    }else{
                        // 若未使用统一身份认证则报错
                        message.error("考试系统只能使用统一身份认证登录")
                        dispatch({type: "userLogout"})
                    }
                }
            })
        }
    }
}