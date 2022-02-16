import {useDispatch, useSelector} from "react-redux";
import cApi from "Utils/API/c-api"
import {useEffect} from "react";

const useContestInfo = (contestId: string) => {
    const contestInfo = useSelector((state: any) => {
        return state.ContestReducer.contestInfo[contestId]
    })
    const dispatch = useDispatch()
    useEffect(() => {
        if (contestInfo === undefined) {
            cApi.getContestInfo({contestId: contestId}).then((res: any) => {
                dispatch({
                    type: "setContestInfo",
                    key: contestId,
                    data: res
                })
            })
        }
    }, [contestInfo])
    return contestInfo
}

export default useContestInfo