import {ICreateSubmit} from "../../Type/IProblem";
import {Dispatch} from "react";
import {ConfigState} from "../../Type/IConfig";
import eApi from "../../Utils/API/e-api";
import {ExamState} from "../../Type/IExam";
import {message} from "antd";
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
