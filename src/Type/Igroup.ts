import {WithTranslation} from "react-i18next";

export interface IGroup {
    id: number,
    createTime: string,
    title: string,
    description: string,
    owner: string,
    openness: number,
    members: number,
}

export interface IGroupPropCbk extends WithTranslation{
    ids: number[],
    callback: (ids: number[]) => void,
    obj?: any
}

export interface groupSelection{
    groupId: string
    title: string
}