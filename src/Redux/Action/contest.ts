export type ContestAction =
    setContestInfo |
    setMinWidth

export interface setMinWidth {
    type: "setMinWidth",
    data: number
}

export interface setContestInfo {
    type: "setContestInfo",
    key: string,
    data: any
}


export interface ContestState {
    contestInfo: { [key: string]: any }
    minWidth: number
}