import {TopSubmissionInfoType} from "../../Type/ISubmission";

export type SubmissionAction =
    setTopSubmission |
    setSubmissionModalVis |
    setSubmissionListInfo


export interface setTopSubmission {
    type: "setTopSubmission"
    submissionID: string
    submissionInfo: TopSubmissionInfoType
}

export interface setSubmissionModalVis {
    type: "setSubmissionModalVis"
    data: boolean
}

export interface setSubmissionListInfo{
    type: "setSubmissionListInfo",
    key: string
    data: any
}