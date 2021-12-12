import {
    examBasicType,
    examProblemGroupType,
    examProblemType,
    examUserType,
    ManageState
} from "../../Type/IManage";
import React, {Dispatch} from "react";
import {ConfigState} from "../../Type/IConfig";
import {examFormChecker} from "../../Utils/Checker/examFormChecker";
import {FormInstance} from "antd";
import {groupSelection} from "../../Type/Igroup";
import mApi from "Utils/API/m-api"

export type ManageAction =
    setProblemList |
    setBasicInfo |
    setProblemGroup |
    setExamMember |
    setExamFormVis


export interface setProblemList{
    type: "setProblemList"
    GroupId: string
    proList: examProblemType[]
}

export interface setBasicInfo{
    type: "setBasicInfo"
    data: examBasicType
}

export interface setProblemGroup{
    type: "setProblemGroup"
    data: examProblemGroupType[]
}


export interface setExamMember{
    type: "setExamMember"
    data: examUserType[]
}

export interface setExamFormVis{
    type: "setExamFormVis"
    data: boolean
}



export type formSubmitType = "create" | "update"


export function SubmitExamFormTodo(type: formSubmitType){
    return (dispatch: Dispatch<any>, getState: any) => {
        const State: ManageState = getState().ConfigReducer
        // if(!examFormChecker(State.examFrom)) return

    }
}