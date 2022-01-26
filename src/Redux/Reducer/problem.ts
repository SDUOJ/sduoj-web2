import {ProblemState} from "../../Type/IProblem";
import {ProblemAction} from "../Action/problem";
import deepClone from "Utils/deepClone";

const StateInit: ProblemState = {}

export const ProblemReducer = (state: ProblemState = StateInit, action: ProblemAction) => {
    // 此处不做深拷贝，redux无法检测到更新
    let State = deepClone(state)

    return State

}