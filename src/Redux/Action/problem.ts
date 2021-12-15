import {ICreateSubmit, JudgeTemplate} from "../../Type/IProblem";
import {Dispatch} from "react";
import cApi from "Utils/API/c-api"
import eApi from "Utils/API/e-api"
import {ConfigState, ModeType} from "../../Type/IConfig";

export type ProblemAction =
    SetTopSubmissionId |
    GetSubmissionInfo

export interface SetTopSubmissionId {
    type: "SetTopSubmissionId"
    submissionID: string
}

export interface GetSubmissionInfo {
    type: "GetSubmissionInfo"
}

export function SubmitToGetSubmissionIDTodo(data: ICreateSubmit) {
    return (dispatch: Dispatch<any>, getState: any) => {
        const State: ConfigState = getState().ConfigReducer
        switch (State.mode){
            case "exam":
                eApi.CreateSubmit(data).then(function (resData) {
                    console.log(resData)
                    dispatch({type: "SetTopSubmissionId", submissionID: resData})
                    // dispatch({type: "GetSubmissionInfo"})
                })
                break;

        }

    }
}