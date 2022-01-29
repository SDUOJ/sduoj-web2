import React from "react";

export interface TableState {
    tableData: {
        [key: string]: {
            selectedRowKeys: React.Key[]
            dataSource: any
            tableVersion: number
        }
    }
}