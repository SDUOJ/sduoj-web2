import React from "react";

export type TableAction =
    setSelectedRowKeys |
    addTableVersion |
    setDataSource


export interface setSelectedRowKeys {
    type: "setSelectedRowKeys",
    name: string
    data: React.Key[]
}

export interface addTableVersion {
    type: "addTableVersion"
    name: string
}

export interface setDataSource {
    type: "setDataSource"
    name: string
    data: any
}