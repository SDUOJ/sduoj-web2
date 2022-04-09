import {ProblemState} from "../../Type/IProblem";
import {ProblemAction} from "../Action/problem";

const StateInit: ProblemState = {
    ProblemInfo: {}
}

export const ProblemReducer = (state: ProblemState = StateInit, action: ProblemAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = {...state}
    switch (action.type) {
        case "setProblemInfo":
            State.ProblemInfo[action.key] = action.data
            break
    }
    return State
}