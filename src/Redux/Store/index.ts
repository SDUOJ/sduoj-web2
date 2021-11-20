import { createStore, combineReducers } from "redux";
import {MTableCalculate} from "../Reducer/MTable";

// 全局你可以创建多个reducer 在这里统一在一起
const rootReducers = combineReducers({MTableCalculate})
// 全局就管理一个store
export const store = createStore(rootReducers)