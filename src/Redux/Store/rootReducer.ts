import {combineReducers} from "redux";

import {MTableCalculate} from "../Reducer/MTable";
import {ExamReducer} from "../Reducer/exam";
import {ConfigReducer} from "../Reducer/config";

// 全局创建多个 reducer 在这里合并统一调度
export const rootReducers =
    combineReducers({
        MTableCalculate,        // TODO
        ExamReducer,            // 考试模块
        ConfigReducer           // 全局配置
    })