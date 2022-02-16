import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import eApi from "Utils/API/e-api"


const useAnswerSheet = (examId: React.Key, groupId: React.Key) => {
    const groupKey = examId + "_" + groupId
    const answerSheets = useSelector((state: any) => {
        return state.ExamReducer.examAnswerSheetInfo[groupKey]
    })
    const dispatch = useDispatch()
    useEffect(() => {
        if (answerSheets === undefined) {
            eApi.getAnswerSheet(examId, groupId).then((res: any) => {
                dispatch({
                    type: "setAnswerSheet",
                    data: res,
                    key: groupKey
                })
            })
        }
    }, answerSheets)
    return answerSheets
}

export default useAnswerSheet