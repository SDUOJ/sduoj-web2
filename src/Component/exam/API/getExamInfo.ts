import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import eApi from "Utils/API/e-api"

const useExamInfo = (examId: React.Key) => {
    const examInfo = useSelector((state: any) => state.ExamReducer.examInfo[examId])
    const dispatch = useDispatch()
    useEffect(() => {
        if (examInfo === undefined) {
            eApi.getExamInfo(examId).then((x: any) => {
                dispatch({
                    type: "setExamInfo",
                    key: examId,
                    data: {
                        id: x.examId,
                        startTime: parseInt(x.gmtStart),
                        endTime: parseInt(x.gmtEnd),
                        title: x.examTitle,
                        participantNum: x.participantNum,
                        description: x.description.toString(),
                        userIsSubmit: x.userIsSubmit,
                        scoreMod: x.features === null ? "show" : x.features.scoreMod ?? "show",
                        testcaseMod: x.features === null ? "show" : x.features.caseMod ?? "show",
                        openReport: x.features === null ? 0 : x.features.openReport ?? 0,
                    }
                })
            })
        }
    }, [examInfo])
    return examInfo
}

export default useExamInfo