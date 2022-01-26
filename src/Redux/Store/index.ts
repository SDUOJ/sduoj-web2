import {applyMiddleware, createStore} from "redux";
import {rootReducers} from "./rootReducer";
import thunk from "redux-thunk";

import {composeWithDevTools} from 'redux-devtools-extension';

// 全局就管理一个store
export const store = createStore(rootReducers,
    composeWithDevTools(
        applyMiddleware(thunk)
    )
)