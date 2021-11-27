import {Locale} from "antd/lib/locale-provider";

export type ConfigAction = updateLanguage

export interface updateLanguage{
    type: "updateLanguage"
    lang: Locale
}