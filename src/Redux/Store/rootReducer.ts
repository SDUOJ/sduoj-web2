import {combineReducers} from "redux";

import {MTableCalculate} from "../Reducer/MTable";
import {ExamReducer} from "../Reducer/exam";
import {ConfigReducer} from "../Reducer/config";
import {ProblemReducer} from "../Reducer/problem";
import {UserReducer} from "../Reducer/user";
import {ManageReducer} from "../Reducer/manage";
import {SubmissionReducer} from "../Reducer/submission";

// 全局创建多个 reducer 在这里合并统一调度
export const rootReducers =
    combineReducers({
        MTableCalculate,        // TODO
        ExamReducer,            // 考试模块
        ConfigReducer,          // 全局配置
        ProblemReducer,         // 题目模块
        UserReducer,            // 用户模块
        ManageReducer,          // 管理端
        SubmissionReducer
    })