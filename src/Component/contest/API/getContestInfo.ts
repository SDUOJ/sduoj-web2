import {useDispatch, useSelector} from "react-redux";
import cApi from "Utils/API/c-api"
import {useEffect, useState} from "react";

const useContestInfo = (contestId: string, update?: boolean) => {
    const contestInfo = useSelector((state: any) => {
        return state.ContestReducer.contestInfo[contestId]
    })
    const dispatch = useDispatch()

    const [hasUpdate, setHasUpdate] = useState(false)

    useEffect(() => {
        if(update === false || hasUpdate) return
        if (contestInfo === undefined || update === true) {
            setHasUpdate(true)
            cApi.getContestInfo({contestId: contestId}).then((res: any) => {
                dispatch({
                    type: "setContestInfo",
                    key: contestId,
                    data: res
                })
            }).catch(()=>{
                setTimeout(()=>{
                    setHasUpdate(false)
                }, 3000)
            })
        }
    }, [contestInfo, update])
    return update === false ? undefined : contestInfo
}

export default useContestInfo