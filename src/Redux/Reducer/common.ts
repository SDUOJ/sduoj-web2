import {CommonAction, CommonState} from "../Action/common";

const initState: CommonState = {
    keyValueData: {}
}

export const CommonReducer = (state: CommonState = initState, action: CommonAction) => {
    let State: CommonState = {...state}

    switch (action.type) {
        case "setKeyValue":
            State.keyValueData = {...state.keyValueData, [action.key]: action.value}
            break

        case "clearRedux":
            return initState;

        default:
            return state
    }

    return State
}
