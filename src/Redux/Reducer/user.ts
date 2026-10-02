import {UserState} from "../../Type/Iuser";
import {UserAction} from "../Action/user";

const initState: UserState = {
    isLogin: false,
    authStatus: 'unknown',
}

export const UserReducer = (state: UserState = initState, action: UserAction) => {
    let State: UserState = {...state}
    switch (action.type) {
        case "setUserInfo":
            State.userInfo = action.data
            break
        case "userLogin":
            State.isLogin = true
            State.authStatus = 'authenticated'
            break
        case "userLogout":
            State.isLogin = false
            State.userInfo = undefined
            State.authStatus = 'anonymous'
            break
        case "authCheckFailed":
            State.isLogin = false
            State.userInfo = undefined
            State.authStatus = 'anonymous'
            // message.info("已退出登录")
            break

        default:
            return state
    }
    return State
}
