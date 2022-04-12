import {ProblemState} from "../../Type/IProblem";
import {ProblemAction} from "../Action/problem";

const initState: ProblemState = {
    ProblemInfo: {}
}

export const ProblemReducer = (state: ProblemState = initState, action: ProblemAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = {...state}
    switch (action.type) {
        case "setProblemInfo":
            State.ProblemInfo[action.key] = action.data
            break
        case "clearRedux":
            return {
                ProblemInfo: {}
            };
    }
    return State
}