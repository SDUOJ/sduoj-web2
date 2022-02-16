import {ExamAction} from "../Action/exam";
import {ExamState} from "../../Type/IExam";


const initState: ExamState = {
    examInfo: {},
    examProListInfo: {},
    examAnswerSheetInfo: {}
}


export const ExamReducer = (state: ExamState = initState, action: ExamAction) => {
    let State: ExamState = {...state}
    switch (action.type) {
        case "setAnswerSheet":
            State.examAnswerSheetInfo[action.key] = action.data
            break
        case "setProLists":
            State.examProListInfo = {
                ...State.examProListInfo,
                ...action.data
            }
            break
        case "setExamInfo":
            State.examInfo[action.key] = action.data
            break
        default:
            break
    }
    return State
}