import CApi from "Utils/API/c-api"
import {
    thirdPartyLoginAction,
    thirdPartyLoginDataSDUCAS,
    thirdPartyLoginResponse,
    UserInfo
} from "../../Type/Iuser";
import {loginInfo} from "../../Type/types";
import {Dispatch} from "react";

export type UserAction =
    setUserInfo |
    userLogin |
    userLogout


export function testLoginTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.getProfile().then((resData) => {
            dispatch({type: "setUserInfo", data: resData as unknown as UserInfo})
            dispatch({type: "userLogin"})
        }).catch(err => {
            dispatch({type: "userLogout"})
        })
    }
}

export function userLoginTodo(data: loginInfo) {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.login(data).then((resData) => {
            if (resData !== null) {
                dispatch({type: "setUserInfo", data: resData})
                dispatch({type: "userLogin"})
            }
        })
    }
}

export function userLogoutTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {
        CApi.logout().then((resData) => {
            dispatch({type: "userLogout"})
        })
    }
}

export function thirdPartyLoginTodo(data: thirdPartyLoginAction) {
    return (dispatch: Dispatch<any>, getState: any) => {
        switch (data.type) {
            case "SDUCAS":
                CApi.thirdPartyLogin({
                    thirdParty: data.type,
                    ticket: (data.data as thirdPartyLoginDataSDUCAS).ticket
                }).then((resData: any) => {
                    if (resData !== null) {
                        let Data = resData as unknown as thirdPartyLoginResponse
                        let userInfo = Data.user
                        Object.assign(userInfo,
                            {
                                realName: Data.sduRealName,
                                sduId: Data.sduId
                            }
                        )
                        dispatch({type: "setUserInfo", data: userInfo})
                        dispatch({type: "userLogin"})
                    }
                })
                break
            default:
                break
        }
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


