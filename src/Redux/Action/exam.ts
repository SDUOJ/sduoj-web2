import {ChoiceState} from "../../Type/IProblem";

export type ExamAction = updateChoice | updateTop | flipFlag | getProList

export interface updateChoice{
    type: "updateChoice"
    ChoiceID: string
    ChoiceState: ChoiceState
}

export interface updateTop{
    type: "updateTop"
    topIndex: number
}

export interface flipFlag{
    type: "flipFlag"
}

export interface getProList{
    type: "GetProList"
}