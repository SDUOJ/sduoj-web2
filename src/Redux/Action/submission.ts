import {TopSubmissionInfoType} from "../../Type/ISubmission";

export type SubmissionAction =
    setTopSubmission |
    setSubmissionModalVis


export interface setTopSubmission {
    type: "setTopSubmission"
    submissionID: string
    submissionInfo: TopSubmissionInfoType
}

export interface setSubmissionModalVis {
    type: "setSubmissionModalVis"
    data: boolean
}
