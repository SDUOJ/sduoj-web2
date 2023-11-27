import CApi from "Utils/API/c-api"
import {UserInfo} from "../../Type/Iuser";
import {Dispatch} from "react";
import {clearRedux} from "./common";

export type UserAction =
    setUserInfo |
    userLogin |
    userLogout |
    clearRedux


export function userLogoutTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.logout().then((resData) => {
            dispatch({type: "userLogout"})
            dispatch({type: "clearRedux"})
        })
    }
}

export interface setUserInfo {
    type: "setUserInfo"
    data: UserInfo
}

export interface userLogin {
    type: "userLogin"
}

export interface userLogout {
    type: "userLogout"
}


