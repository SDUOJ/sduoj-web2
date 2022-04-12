import {Dispatch} from "react";
import eApi from "Utils/API/e-api"
import {ExamState, SExamAnswerSheet, SExamInfo, SExamProListInfo} from "../../Type/IExam";
import {isValueEmpty} from "../../Utils/empty";
import {clearRedux} from "./common";


export type ExamAction =
    setProLists |
    setExamInfo |
    setAnswerSheet |
    clearRedux


export interface setProLists {
    type: "setProLists"
    data: { [key: string]: SExamProListInfo }
}

export interface setExamInfo {
    type: "setExamInfo"
    data: SExamInfo
    key: string
}

export interface setAnswerSheet {
    type: "setAnswerSheet",
    data: SExamAnswerSheet[]
    key: string
}

export function updateChoiceTodo(groupKey: string, proIndex: number, choice: string, action: "yes" | "no") {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        const proNumber = EState.examProListInfo[groupKey].proList.length
        // 获取当前的数据
        if (isValueEmpty(EState.examAnswerSheetInfo[groupKey])) {
            EState.examAnswerSheetInfo[groupKey] = []
        }
        const answerSheets = EState.examAnswerSheetInfo[groupKey]
        for (let i = 0; i < proNumber; i++) {
            if (isValueEmpty(answerSheets[i]))
                answerSheets[i] = {index: i, answer: [], pass: [], marked: false}
            if (answerSheets[i].index !== i) answerSheets[i].index = i
        }

        const answerSheet = answerSheets[proIndex]
        const proListType = EState.examProListInfo[groupKey].type
        // 根据用户操作，更新当前答题卡数据
        if (action === "yes") {
            if (answerSheet.answer.includes(choice))
                answerSheet.answer = answerSheet.answer.filter(value => value !== choice)
            else {
                if (proListType === "SingleChoice") answerSheet.answer = []
                answerSheet.answer.push(choice)
            }
            answerSheet.pass = answerSheet.pass.filter(value => value !== choice)
        } else if (action === "no") {
            if (answerSheet.pass.includes(choice))
                answerSheet.pass = answerSheet.pass.filter(value => value !== choice)
            else answerSheet.pass.push(choice)
            answerSheet.answer = answerSheet.answer.filter(value => value !== choice)
        }
        answerSheets[proIndex] = answerSheet
        // 更新当前答题卡
        dispatch(setAnswerSheetTodo(answerSheets, groupKey))
    }
}

export function updateFlagTodo(groupKey: string, proIndex: number) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        const proNumber = EState.examProListInfo[groupKey].proList.length
        // 获取当前的数据
        if (isValueEmpty(EState.examAnswerSheetInfo[groupKey])) {
            EState.examAnswerSheetInfo[groupKey] = []
        }
        const answerSheets = EState.examAnswerSheetInfo[groupKey]
        for (let i = 0; i < proNumber; i++) {
            if (isValueEmpty(answerSheets[i]))
                answerSheets[i] = {index: i, answer: [], pass: [], marked: false}
            if (answerSheets[i].index !== i) answerSheets[i].index = i
        }
        const answerSheet = answerSheets[proIndex]
        answerSheet.marked = !answerSheet.marked
        // 更新当前答题卡
        dispatch(setAnswerSheetTodo(answerSheets, groupKey))
    }
}


export function setAnswerSheetTodo(answerSheets: SExamAnswerSheet[], groupKey: string) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const examId = groupKey.split("_")[0]
        const groupId = groupKey.split("_")[1]
        for (const x of answerSheets) x['choice'] = undefined
        eApi.setAnswerSheet({problemAnswer: answerSheets}, examId, groupId).then(() => {
            dispatch({
                type: "setAnswerSheet",
                data: answerSheets,
                key: groupKey
            })
        })
    }
}
