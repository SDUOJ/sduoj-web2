import {SubmissionState} from "../../Type/ISubmission";
import {SubmissionAction} from "../Action/submission";

const initState: SubmissionState = {
    SubmissionModalVis: false,
    submissionListInfo: {}
}

export const SubmissionReducer = (state: SubmissionState = initState, action: SubmissionAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: SubmissionState = {...state}
    switch (action.type){
        case "setTopSubmission":
            State.TopSubmissionId = action.submissionID
            State.TopSubmissionInfo = action.submissionInfo
            break
        case "setSubmissionModalVis":
            State.SubmissionModalVis = action.data
            break
        case "setSubmissionListInfo":
            State.submissionListInfo[action.key] = action.data
            break
        case "clearRedux":
            return initState;
    }
    return State
}