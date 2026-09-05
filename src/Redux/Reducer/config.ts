import {ConfigState} from "../../Type/IConfig";
import {ConfigAction} from "../Action/config";
import {languageMap} from "../../Config/i18n";
import {initLanguage} from "../../Utils/initLanguage";

const initState: ConfigState = {
    lang: languageMap[initLanguage()],
    langCode: "",
    mode: "exam",
    timestamp: Date.now(),
    copyRight: ""
}


export const ConfigReducer = (state: ConfigState = initState, action: ConfigAction) => {
    let State = {...state}

    switch (action.type) {
        case "updateLanguage":
            State.lang = action.lang
            State.langCode = action.langCode
            break
        case "updateTimestamp":
            State.timestamp = action.timestamp
            break

        case "setCopyRight":
            State.copyRight = action.data
            break

        case "clearRedux":
            return initState;

        default:
            return state
    }

    return State
}
