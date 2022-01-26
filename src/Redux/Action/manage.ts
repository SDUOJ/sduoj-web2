import React from "react";


export type ManageAction =
    setSelectedRowKeys |
    addTableVersion |
    setDataSource



export interface setSelectedRowKeys{
    type: "setSelectedRowKeys",
    data: React.Key[]
}

export interface addTableVersion{
    type: "addTableVersion"
    data: string
}

export interface setDataSource{
    type: "setDataSource"
    data: any
}