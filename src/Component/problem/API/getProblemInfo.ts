import {useDispatch, useSelector} from "react-redux";
import {useEffect} from "react";

const useProblemInfo = (fun: any, key: string) => {
    const problemInfo = useSelector((state: any) => {
        return state.ProblemReducer.ProblemInfo[key]
    })
    const dispatch = useDispatch()
    useEffect(() => {
        if (problemInfo === undefined) {
            fun().then((res: any) => {
                dispatch({
                    type: "setProblemInfo",
                    key: key,
                    data: res
                })
            })
        }
    }, [problemInfo])
    return problemInfo
}

export default useProblemInfo