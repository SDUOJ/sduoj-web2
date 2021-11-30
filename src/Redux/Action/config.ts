import {Locale} from "antd/lib/locale-provider";

export type ConfigAction =
    updateLanguage |
    updateTimestamp

export interface updateLanguage{
    type: "updateLanguage"
    lang: Locale
}

export interface updateTimestamp{
    type: "updateTimestamp"
    timestamp: number
}