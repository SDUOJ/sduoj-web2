import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";

const useProblemInfo = (fun: any, key: string) => {
    const problemInfo = useSelector((state: any) => {
        return state.ProblemReducer.ProblemInfo[key]
    })
    const problemInfo_cache = useSelector((state: any) => {
        return state.ProblemReducer.ProblemInfo[key + "-cache"]
    })
    const dispatch = useDispatch()
    const [nowKey, setNowKey] = useState<string>()
    const [nowValue, setNowValue] = useState<any>()
    useEffect(() => {
        if (nowKey !== key) {
            if (problemInfo_cache === undefined && problemInfo === undefined) {
                dispatch({
                    type: "setProblemInfo",
                    key: key + "-cache",
                    data: true
                })
                fun().then((res: any) => {
                    dispatch({
                        type: "setProblemInfo",
                        key: key,
                        data: res
                    })
                    dispatch({
                        type: "setProblemInfo",
                        key: key + "-cache",
                        data: undefined
                    })
                    setNowValue(res)
                })
            } else {
                setNowValue(problemInfo)
            }
            setNowKey(key)
        }else{
            setNowValue(problemInfo)
        }
    }, [problemInfo, key])
    return nowValue
}

export default useProblemInfo
