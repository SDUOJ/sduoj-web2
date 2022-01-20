import React from "react";


export type ManageAction =
    setSelectedRowKeys |
    addTableVersion



export interface setSelectedRowKeys{
    type: "setSelectedRowKeys",
    data: React.Key[]
}

export interface addTableVersion{
    type: "addTableVersion"
    data: string
}