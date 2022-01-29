import deepClone from "Utils/deepClone";
import {ManageState} from "../../Type/IManage";
import {ManageAction} from "../Action/manage";


const initState: ManageState = {
    userData: {},
}


export const ManageReducer = (state: ManageState = initState, action: ManageAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: ManageState = deepClone(state)
    // switch (action.type) {
    //
    //
    //
    //     default:
    //         break
    // }
    return State
}