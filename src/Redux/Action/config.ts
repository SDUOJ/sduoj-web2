import {Locale} from "antd/lib/locale-provider";
import {Dispatch} from "react";
import cApi from "../../Utils/API/c-api";

export type ConfigAction =
    updateLanguage |
    updateTimestamp |
    setCopyRight

export interface updateLanguage {
    type: "updateLanguage"
    lang: Locale
    langCode: string
}

export interface updateTimestamp {
    type: "updateTimestamp"
    timestamp: number
}

export interface setCopyRight{
    type: "setCopyRight"
    data: string
}

export function getCopyRightTodo() {
    return (dispatch: Dispatch<any>, getState: any) => {

        cApi.getCopyright().then(function (resData) {
            // console.log("copy", resData)
            dispatch({type: "setCopyRight", data: resData})
        })


    }
}