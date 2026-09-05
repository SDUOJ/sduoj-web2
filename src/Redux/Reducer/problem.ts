import {ProblemState} from "../../Type/IProblem";
import {ProblemAction} from "../Action/problem";

const initState: ProblemState = {
    ProblemInfo: {}
}

export const ProblemReducer = (state: ProblemState = initState, action: ProblemAction) => {
    let State = {...state}
    switch (action.type) {
        case "setProblemInfo":
            State.ProblemInfo = {...state.ProblemInfo, [action.key]: action.data}
            break
        case "clearRedux":
            return {
                ProblemInfo: {}
            };
        default:
            return state
    }
    return State
}
