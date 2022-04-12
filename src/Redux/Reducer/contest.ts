import {ContestAction, ContestState} from "../Action/contest";

const initState: ContestState = {
    contestInfo: {},
    minWidth: 0,
    afterContestSubmission: false,
    sliderTime: 0,
    allowSliderMove: false,
    openSliderMove: false
}

export const ContestReducer = (state: ContestState = initState, action: ContestAction) => {
    let State = {...state}
    switch (action.type){
        case "setContestInfo":
            State.contestInfo[action.key] = action.data
            break

        case "setMinWidth":
            State.minWidth = action.data
            break
        case "setAfterContestSubmission":
            State.afterContestSubmission = action.data
            break
        case "setAllowSliderMove":
            State.allowSliderMove = action.data
            break
        case "setSliderTime":
            State.sliderTime = action.data
            break
        case "setOpenSliderMove":
            State.openSliderMove = action.data
            break
        case "clearRedux":
            return {
                contestInfo: {},
                minWidth: 0,
                afterContestSubmission: false,
                sliderTime: 0,
                allowSliderMove: false,
                openSliderMove: false
            };
    }
    return State
}