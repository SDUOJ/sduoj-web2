export type ProblemAction = setProblemInfo


export interface setProblemInfo {
    type: "setProblemInfo"
    key: string
    data: any
}