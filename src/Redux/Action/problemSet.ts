import {clearRedux} from "./common";

export type ProblemSetAction =
    setProblemSetInfo |
    clearRedux

export interface setProblemSetInfo {
    type: "setProblemSetInfo",
    key: string,
    data: any
}


export interface ProblemSetState {
    problemSetInfo: { [key: string]: any }
}