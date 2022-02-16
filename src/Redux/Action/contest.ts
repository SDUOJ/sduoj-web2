
export type ContestAction =
    setContestInfo

export interface setContestInfo{
    type: "setContestInfo",
    key: string,
    data: any
}


export interface ContestState{
    contestInfo: {[key: string]: any}
}