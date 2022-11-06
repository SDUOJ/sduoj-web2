import deepClone from "../../Utils/deepClone";
import {CommonAction, CommonState} from "../Action/common";

const initState: CommonState = {
    keyValueData: {}
}

export const CommonReducer = (state: CommonState = initState, action: CommonAction) => {
    let State: CommonState = deepClone(state)

    switch (action.type) {
        case "setKeyValue":
            State.keyValueData[action.key] = action.value
            break

        case "clearRedux":
            return initState;

        default:
            break
    }

    return State
}