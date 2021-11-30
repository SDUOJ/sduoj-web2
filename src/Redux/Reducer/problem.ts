import Problem from "../../Component/problem/Problem";
import {ProblemState} from "../../Type/IProblem";
import {ProblemAction} from "../Action/problem";
import {deepClone} from "@ant-design/charts/es/util";

const StateInit: ProblemState = {
    SubmitModalVis: false,
}

export const ProblemReducer = (state: ProblemState = StateInit, action: ProblemAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = deepClone(state)
    switch (action.type) {
        case "OpenSubmitModal":
            State.SubmitModalVis = true
            return State
        case "CloseSubmitModal":
            State.SubmitModalVis = false
            return State
        case "SetTopSubmissionId":
            State.TopSubmissionId = action.submissionID
            return State
        // case "GetSubmissionInfo":

        default:
            return State
    }
}