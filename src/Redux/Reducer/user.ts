import {deepClone} from "@ant-design/charts/es/util";
import {UserState} from "../../Type/Iuser";
import {UserAction} from "../Action/user";
import cookie from "react-cookies";
import {message} from "antd";

const StateInit: UserState = {
    isLogin: false
}

export const UserReducer = (state: UserState = StateInit, action: UserAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: UserState = deepClone(state)
    switch (action.type) {
        case "setUserInfo":
            State.userInfo = action.data
            break
        case "userLogin":
            State.isLogin = true
            break
        case "userLogout":
            State.isLogin = false
            State.userInfo = undefined
            // message.info("已退出登录")
            break

        default:
            break
    }
    return State
}