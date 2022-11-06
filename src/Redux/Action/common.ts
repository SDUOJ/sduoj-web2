export type CommonAction =
    clearRedux |
    setKeyValue

export interface clearRedux {
    type: "clearRedux"
}

export interface setKeyValue {
    type: "setKeyValue",
    key: string,
    value: any
}

export interface CommonState {
    keyValueData: { [key: string]: any }
}