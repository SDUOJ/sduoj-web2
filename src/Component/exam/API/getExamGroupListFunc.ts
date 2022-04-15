import {SExamProListInfo, SProList} from "../../../Type/IExam";
import eApi from "../../../Utils/API/e-api";
import deepClone from "../../../Utils/deepClone";

export const getExamGroupListFunc = (res : any, eid: any, dispatch: any, openReport:boolean=false)=>{
    let data: { [key: string]: SExamProListInfo } = {}
    let plistIndex = 0;
    for(const x of res){
        x.index = x.index ?? plistIndex
        plistIndex += 1
    }
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
        if (x.type === "SingleChoice" || x.type === "MultipleChoice") {
            eApi.getAnswerSheet(eid, x.index, openReport).then((res: any) => {
                dispatch({
                    type: "setAnswerSheet",
                    data: res?.problemAnswer ?? [],
                    key: eid + "_" + x.index
                })
            })
        }
        data[eid + "_" + x.index] = {
            index: x.index,
            title: x.title,
            previous: x.previous,
            type: x.type,
            groupStart: parseInt(x.groupStart),
            groupEnd: parseInt(x.groupEnd),
            proList: proList
        }
    }
    data[eid] = deepClone(data)
    dispatch({
        type: "setProLists",
        data: data
    })
}