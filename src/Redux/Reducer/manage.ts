import {deepClone} from "@ant-design/charts/es/util";
import {examProblemGroupType, examProblemListType, ManageState} from "../../Type/IManage";
import {ManageAction} from "../Action/manage";
import {update} from "js-md5";


const initState: ManageState = {
    examData: {
        examBasicInfo:{
            examTitle: "",
            examStartEndTime: [],
            examDescription: ""
        },
        examProblemListInfo: [],
        examProblemGroupInfo: [],
        examFormVis: false,
    }
}


export const ManageReducer = (state: ManageState = initState, action: ManageAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: ManageState = state
    switch (action.type) {
        case "setExamFormVis":
            State.examData.examFormVis = action.data
            break


        default:
            break
    }
    return State
}