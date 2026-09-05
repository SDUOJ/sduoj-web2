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

const copyAnswerSheets = (state: ExamState, groupKey: string): SExamAnswerSheet[] =>
    Array.from({length: state.examProListInfo[groupKey].proList.length}, (_, index) => {
        const sheet = state.examAnswerSheetInfo[groupKey]?.[index];
        return sheet
            ? {...sheet, index, answer: [...sheet.answer], pass: [...sheet.pass]}
            : {index, answer: [], pass: [], marked: false};
    });

export function updateChoiceTodo(groupKey: string, proIndex: number, choice: string, action: "yes" | "no") {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        const answerSheets = copyAnswerSheets(EState, groupKey)

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
        return dispatch(setAnswerSheetTodo(answerSheets, groupKey))
    }
}

export function updateFlagTodo(groupKey: string, proIndex: number) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const EState: ExamState = getState().ExamReducer
        const answerSheets = copyAnswerSheets(EState, groupKey)
        const answerSheet = answerSheets[proIndex]
        answerSheet.marked = !answerSheet.marked
        // 更新当前答题卡
        return dispatch(setAnswerSheetTodo(answerSheets, groupKey))
    }
}


export function setAnswerSheetTodo(answerSheets: SExamAnswerSheet[], groupKey: string) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const examId = groupKey.split("_")[0]
        const groupId = groupKey.split("_")[1]
        const submittedSheets = answerSheets.map((sheet) => ({...sheet, choice: undefined}));
        return eApi.setAnswerSheet({problemAnswer: submittedSheets}, examId, groupId).then(() => {
            dispatch({
                type: "setAnswerSheet",
                data: submittedSheets,
                key: groupKey
            })
        })
    }
}
