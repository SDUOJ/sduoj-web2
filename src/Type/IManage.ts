import React from "react";


interface TableType{
    selectedRowKeys: React.Key[]
    dataSource: any[]
    tableVersion: any
}

export interface userDataType {

}

export interface ManageState {
    userData: userDataType
    tableData: TableType
}


export interface SubmissionQueryType {
    username?: string,
    judgeResult?: string,
    pageNow: number,
    pageSize: number,
    sortBy?: string,
    ascending?: string,
    problemCode?: string
}

export const genNumberList = (data: any) => {
    let res = []
    for (const x of data) res.push(x.id)
    return res
}

export const genAnswerList = (data: any) => {
    let res = []
    for (let i = 0; i < data.length; i++)
        res.push(String.fromCharCode('A'.charCodeAt(0) + i))
    return res
}

export const genEditableList = (data: any) => {
    let res = []
    for (let i = 0; i < data.length; i++)
        res.push(i)
    return res
}