

export interface MTableAction{
    type: "Data" | "Row" | ""
    method: "update" | "delete" | "add" | "get"
    data: []
}

// export const UpdateData = (data: any): UpdateDataAction => {
//     return {type: "UpdateDate", data: data}
// }