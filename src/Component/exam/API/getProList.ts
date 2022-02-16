import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import eApi from "Utils/API/e-api"
import {SExamProListInfo, SProList} from "../../../Type/IExam";

const useProList = (examId: React.Key, groupId: React.Key) => {
    const groupKey = examId + "_" + groupId
    const proList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[groupKey]
    })
    const dispatch = useDispatch()
    useEffect(() => {
        if (proList === undefined) {
            eApi.getExamGroupList(examId).then((res: any)=>{
                let data:{ [key: string]: SExamProListInfo } = {}
                for (const x of res) {
                    const proList: SProList[] = []
                    let cnt = 0
                    for (const y of x.problems) {
                        proList.push({
                            index: cnt,
                            score: y.problemScore,
                        })
                        cnt++;
                    }
                    data[examId + "_" + x.index] = {
                        index: x.index,
                        title: x.title,
                        previous: x.previous,
                        type: x.type,
                        groupStart: parseInt(x.groupStart),
                        groupEnd: parseInt(x.groupEnd),
                        proList: proList
                    }
                }
                dispatch({
                    type: "setProLists",
                    data: data
                })
            })
        }
    }, proList)
    return proList
}

export default useProList