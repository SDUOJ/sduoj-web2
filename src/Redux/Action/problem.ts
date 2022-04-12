import {clearRedux} from "./common";

export type ProblemAction = setProblemInfo |
    clearRedux


export interface setProblemInfo {
    type: "setProblemInfo"
    key: string
    data: any
}