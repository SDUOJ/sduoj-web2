export type ContestAction =
    setContestInfo |
    setMinWidth |
    setAfterContestSubmission

export interface setMinWidth {
    type: "setMinWidth",
    data: number
}

export interface setContestInfo {
    type: "setContestInfo",
    key: string,
    data: any
}

export interface setAfterContestSubmission{
    type: "setAfterContestSubmission",
    data: boolean
}


export interface ContestState {
    contestInfo: { [key: string]: any }
    minWidth: number
    afterContestSubmission: boolean
}