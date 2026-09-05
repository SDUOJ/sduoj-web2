import {ManageState} from "../../Type/IManage";
import {ManageAction} from "../Action/manage";


const initState: ManageState = {
    manageInitData: {}
}


export const ManageReducer = (state: ManageState = initState, action: ManageAction) => {
    let State: ManageState = {...state}
    switch (action.type) {
        case "addManageInitData":
            State.manageInitData = {...state.manageInitData, [action.key]: action.data}
            break
        case "clearRedux":
            return {
                manageInitData: {}
            };
        default:
            return state
    }
    return State
}
