import {ProblemSetAction, ProblemSetState} from "../Action/problemSet";

const initState: ProblemSetState = {
    problemSetInfo: {},
}

export const ProblemSetReducer = (state: ProblemSetState = initState, action: ProblemSetAction) => {
    let State = {...state}
    switch (action.type) {
        case "setProblemSetInfo":
            State.problemSetInfo[action.key] = action.data
            break

        case "clearRedux":
            return initState;
    }
    return State
}