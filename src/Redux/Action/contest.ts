import {clearRedux} from "./common";

export type ContestAction =
    setContestInfo |
    setMinWidth |
    setAfterContestSubmission |
    setAllowSliderMove |
    setSliderTime |
    setOpenSliderMove |
    clearRedux |
    setExportData

export interface setMinWidth {
    type: "setMinWidth",
    data: number
}

export interface setContestInfo {
    type: "setContestInfo",
    key: string,
    data: any
}

export interface setAfterContestSubmission {
    type: "setAfterContestSubmission",
    data: boolean
}

export interface setAllowSliderMove {
    type: "setAllowSliderMove",
    data: boolean
}

export interface setSliderTime {
    type: "setSliderTime",
    data: number
}

export interface setOpenSliderMove {
    type: "setOpenSliderMove"
    data: boolean
}

export interface setExportData{
    type: "setExportData"
    data: any
}

export interface ContestState {
    contestInfo: { [key: string]: any }
    minWidth: number
    afterContestSubmission: boolean
    allowSliderMove: boolean
    sliderTime: number
    openSliderMove: boolean
    exportData: any
}