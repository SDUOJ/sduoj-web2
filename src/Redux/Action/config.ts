import {Locale} from "antd/lib/locale-provider";
import "./common"
import {clearRedux} from "./common";

export type ConfigAction =
    updateLanguage |
    updateTimestamp |
    setCopyRight |
    clearRedux

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
