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
    const initTableData = (name: string) => {
        if (State.tableData[name] === undefined)
            State.tableData[name] = {
                selectedRowKeys: [],
                dataSource: [],
                tableVersion: 0
            }
    }

    switch (action.type) {
        case "setSelectedRowKeys":
            initTableData(action.name)
            State.tableData[action.name].selectedRowKeys = action.data
            break

        case "addTableVersion":
            initTableData(action.name)
            State.tableData[action.name].tableVersion += 1
            break

        case "setDataSource":
            initTableData(action.name)
            State.tableData[action.name].dataSource = action.data
            break

        default:

    }
    return State
}