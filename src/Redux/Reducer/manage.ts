import deepClone from "Utils/deepClone";
import {ManageState} from "../../Type/IManage";
import {ManageAction} from "../Action/manage";
import {update} from "js-md5";
import {examProblemGroupType, examProblemListType} from "../../Type/IExam";


const initState: ManageState = {
    userData: {},
    tableData:{
        selectedRowKeys: [],
        dataSource: [],
        tableVersion: {}
    }
}


export const ManageReducer = (state: ManageState = initState, action: ManageAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State: ManageState = deepClone(state)
    switch (action.type) {

        case "setSelectedRowKeys":
            State.tableData.selectedRowKeys = action.data
            break

        case "addTableVersion":
            let value = State.tableData.tableVersion[action.data]
            if(value === undefined) State.tableData.tableVersion[action.data] = 1
            else State.tableData.tableVersion[action.data] += 1
            break

        case "setDataSource":
            State.tableData.dataSource = action.data
            break

        default:
            break
    }
    return State
}