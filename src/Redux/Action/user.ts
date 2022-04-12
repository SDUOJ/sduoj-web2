import CApi from "Utils/API/c-api"
import {UserInfo} from "../../Type/Iuser";
import {loginInfo} from "../../Type/types";
import {Dispatch} from "react";
import {clearRedux} from "./common";

export type UserAction =
    setUserInfo |
    userLogin |
    userLogout |
    clearRedux


export function testLoginTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.getProfile().then((resData) => {
            dispatch({type: "setUserInfo", data: resData as unknown as UserInfo})
            dispatch({type: "userLogin"})
        }).catch(err => {
            dispatch({type: "userLogout"})
            dispatch({type: "clearRedux"})
        })
    }
}

export function userLoginTodo(data: loginInfo) {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.login(data).then((r:any) => {
            CApi.getProfile().then((resData: any)=>{
                dispatch({type: "userLogin"})
                dispatch({type: "setUserInfo", data: resData})
            })
        })
    }
}

export function userLogoutTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.logout().then((resData) => {
            dispatch({type: "userLogout"})
            dispatch({type: "clearRedux"})
        })
    }
}


export function userGetProfileTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.getProfile().then((resData) => {
            if (resData !== null) {
                dispatch({type: "setUserInfo", data: resData})
            }
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


