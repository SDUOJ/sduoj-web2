import {createStore, applyMiddleware} from "redux";
import {rootReducers} from "./rootReducer";
import thunk from "redux-thunk";

// 全局就管理一个store
export const store = createStore(rootReducers, applyMiddleware(thunk))