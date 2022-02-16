import {useDispatch, useSelector} from "react-redux";
import {useEffect} from "react";

const useSubmissionList = (fun: any, key: string) => {
    const submissionInfo = useSelector((state: any) => {
        return state.SubmissionReducer.submissionListInfo[key]
    })
    const dispatch = useDispatch()
    useEffect(() => {
        if (submissionInfo === undefined) {
            fun().then((res: any) => {
                dispatch({
                    type: "setSubmissionListInfo",
                    key: key,
                    data: res
                })
            })
        }
    }, [submissionInfo])
    return submissionInfo
}

export default useSubmissionList