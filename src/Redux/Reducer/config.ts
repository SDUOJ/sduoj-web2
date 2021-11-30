import {deepClone} from "@ant-design/charts/es/util";
import {ConfigState} from "../../Type/IConfig";
import {ConfigAction} from "../Action/config";
import {languageMap} from "../../Config/i18n";

const initState: ConfigState = {
    lang: languageMap['zh'],
    mode: "exam",
    timestamp: Date.now()
}


export const ConfigReducer = (state: ConfigState = initState, action: ConfigAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = state

    switch (action.type) {
        case "updateLanguage":
            State.lang = action.lang
            break
        case "updateTimestamp":
            console.log(action.timestamp)
            State.timestamp = action.timestamp
            break

        default:
            break
    }

    return State
}