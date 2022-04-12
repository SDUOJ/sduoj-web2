import {clearRedux} from "./common";

export type ManageAction = addManageInitData |
    clearRedux

interface addManageInitData {
    type: "addManageInitData",
    key: string,
    data: any
}