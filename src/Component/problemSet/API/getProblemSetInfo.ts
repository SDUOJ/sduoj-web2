import {useDispatch, useSelector} from "react-redux";
import cApi from "Utils/API/c-api"
import {useEffect, useState} from "react";

const useProblemSetInfo = (psid: string, onError: any = undefined) => {
    const problemSetInfo = useSelector((state: any) => {
        return state.ProblemSetReducer.problemSetInfo[psid]
    })
    const problemSetInfo_cache = useSelector((state: any) => {
        return state.ProblemSetReducer.problemSetInfo[psid + "-cache"]
    })
    const dispatch = useDispatch()

    const [nowKey, setNowKey] = useState<string>()
    const [nowValue, setNowValue] = useState<any>()

    useEffect(() => {
        if (nowKey !== psid) {
            if (problemSetInfo_cache === undefined && problemSetInfo === undefined) {
                dispatch({
                    type: "setProblemSetInfo",
                    key: psid + "-cache",
                    data: true
                })
                cApi.getProblemSetInfo({psid: parseInt(psid)}).then((res: any) => {
                    dispatch({
                        type: "setProblemSetInfo",
                        key: psid,
                        data: res
                    })
                    dispatch({
                        type: "setProblemSetInfo",
                        key: psid + "-cache",
                        data: undefined
                    })
                    setNowValue(res)
                }).catch((error) => {
                    onError && onError(error)
                })
            } else {
                setNowValue(problemSetInfo)
            }
            setNowKey(psid)
        } else {
            setNowValue(problemSetInfo)
        }
    }, [problemSetInfo, psid])
    return nowValue
}

export default useProblemSetInfo
