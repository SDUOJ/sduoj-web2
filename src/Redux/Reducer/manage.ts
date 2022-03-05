import deepClone from "Utils/deepClone";
import {ManageState} from "../../Type/IManage";
import {ManageAction} from "../Action/manage";


const initState: ManageState = {
    manageInitData: {}
}


export const ManageReducer = (state: ManageState = initState, action: ManageAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: ManageState = deepClone(state)
    switch (action.type) {
        case "addManageInitData":
            State.manageInitData[action.key] = action.data
            break
    }
    return State
}