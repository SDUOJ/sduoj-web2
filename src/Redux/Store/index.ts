import { applyMiddleware, legacy_createStore as createStore } from "redux";
import {rootReducers} from "./rootReducer";
import { thunk } from "redux-thunk";

import {composeWithDevTools} from '@redux-devtools/extension';

// 全局就管理一个store
export const createAppStore = () => createStore(
    rootReducers,
    undefined,
    composeWithDevTools(applyMiddleware(thunk))
);

export const store = createAppStore();
export type RootState = ReturnType<typeof rootReducers>;
export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
