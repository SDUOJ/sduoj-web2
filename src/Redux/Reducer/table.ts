import {TableAction} from "../Action/table";
import {TableState} from "../../Type/ITable";

interface MTableState {
    Data: []
    SelectedRow: []
}

const initState: TableState = {
    tableData: {}
}

export const TableReduce = (state: TableState = initState, action: TableAction) => {
    let State = {...state}
    State.tableData = {...State.tableData}
    const initTableData = (name: string) => {
        if (State.tableData[name] === undefined)
            State.tableData[name] = {
                selectedRowKeys: [],
                dataSource: [],
                tableVersion: 0,
                tableInfo: {}
            }
    }

    switch (action.type) {
        case "setSelectedRowKeys":
            initTableData(action.name)
            State.tableData[action.name].selectedRowKeys = action.data
            break

        case "addTableVersion":
            initTableData(action.name)
            const nv = State.tableData[action.name].tableVersion
            State.tableData[action.name].tableVersion = Math.abs(nv) + 1
            break

        case "setDataSource":
            initTableData(action.name)
            State.tableData[action.name].dataSource = action.data
            if(action.add) {
                const nv = State.tableData[action.name].tableVersion
                State.tableData[action.name].tableVersion = -(Math.abs(nv) + 1)
            }
            break

        case "setTableInfo":
            initTableData(action.name)
            State.tableData[action.name].tableInfo = action.data
            break
        case "clearRedux":
            return {
                tableData: {}
            };

        default:

    }
    return State
}