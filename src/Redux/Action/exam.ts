import {examID} from "../../Type/types";
import {Dispatch} from "react";
import eApi from "Utils/API/e-api"
import {ExamState, SExamAnswerSheet, SExamInfo, SExamProListInfo} from "../../Type/IExam";
import {isValueEmpty} from "../../Utils/empty";


export type ExamAction =
    setProLists |
    setExamInfo |
    setAnswerSheet


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

// export function getExamProblemListTodo(eid: examID) {
//     return (dispatch: Dispatch<any>, getState: any) => {
//         eApi.getExamGroupList(eid).then(function (resData: any) {
//             if (resData !== null) {
//                 // console.log("getExamGroupList", resData)
//                 let data: SProGroupInfo[] = []
//                 for (const x of resData) {
//                     const proList: SProInfo[] = []
//                     let cnt = 0
//                     for (const y of x.problems) {
//                         proList.push({
//                             index: cnt,
//                             score: y.problemScore,
//                             flag: false,
//                         })
//                         cnt++;
//                     }
//                     data.push({
//                         index: x.index,
//                         title: x.title,
//                         previous: x.previous,
//                         type: x.type,
//                         groupStart: parseInt(x.groupStart),
//                         groupEnd: parseInt(x.groupEnd),
//                         proList: proList
//                     })
//                 }
//                 // 更新当前目录
//                 dispatch({type: "setProList", data: data})
//             }
//         }).catch(() => {
//             dispatch({type: "cleanProList"})
//         })
//     }
// }


// export function getProblemTodo(data: IGetProInfo) {
//     return (dispatch: Dispatch<any>, getState: any) => {
//         const State: ExamState = getState().ExamReducer
//         const groupId = data.groupIndex
//         const proId = data.problemIndex
//         eApi.getProInfo(data).then((resData: any) => {
//             if (resData !== null) {
//                 const type = (State.proGroupInfo as SProGroupInfo[]) [State.TopGroupIndex - 1].type
//                 let data: ProContent | undefined = undefined
//                 if (type === "Program") {
//                     let testCase: TestCase[] = []
//                     for (const x of resData.problemCaseDTOList) {
//                         testCase.push({
//                             "inputData": x.input,
//                             "outputData": x.output
//                         })
//                     }
//                     let markdown = resData.problemDescriptionDTO.markdownDescription
//                     data = {
//                         isLoad: true,
//                         title: resData.problemTitle,
//                         markdown: markdown,
//                         testCase: testCase,
//                         TimeLimit: resData.timeLimit,
//                         MemoryLimit: resData.memoryLimit,
//                         JudgeTemplate: resData.judgeTemplates,
//                         Submissions: [],
//                         MaxSubmitNumber: resData.submitNum,
//                         SumScore: resData.sumScore
//                     }
//                 }
//                 if (type === "SingleChoice" || type === "MultipleChoice") {
//                     let choice: Choice[] = []
//                     for (const x of Object.keys(resData.description.choice)) {
//                         choice.push({
//                             id: x,
//                             content: resData.description.choice[x],
//                             state: "init"
//                         })
//                     }
//                     data = {
//                         isLoad: true,
//                         content: resData.description.content,
//                         choice: choice
//                     }
//                 }
//                 dispatch({
//                     type: "setProInfo",
//                     groupId: groupId,
//                     proId: proId,
//                     data: data
//                 })
//             }
//         })
//     }
// }
