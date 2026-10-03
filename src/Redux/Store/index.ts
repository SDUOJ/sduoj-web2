import { applyMiddleware, legacy_createStore as createStore, Middleware } from 'redux';
import { rootReducers } from './rootReducer';
import { thunk } from 'redux-thunk';
import {
  clearAllPendingMedia,
  clearPendingMediaForOwner,
} from '../../Pages/Manage/AI/interview-media';

import { composeWithDevTools } from '@redux-devtools/extension';

// 全局就管理一个store
export type RootState = ReturnType<typeof rootReducers>;

export const interviewMediaAuthMiddleware: Middleware<{}, RootState> =
  ({ getState }) =>
  (next) =>
  (action) => {
    const previousOwner = getState().UserReducer.userInfo?.userId;
    const result = next(action);
    const currentOwner = getState().UserReducer.userInfo?.userId;
    const type = (action as { type?: string })?.type;
    if (type === 'userLogout' || type === 'authCheckFailed') {
      void clearAllPendingMedia().catch(() => undefined);
    } else if (type === 'setUserInfo' && previousOwner && currentOwner !== previousOwner) {
      void clearPendingMediaForOwner(previousOwner).catch(() => undefined);
    }
    return result;
  };

export const createAppStore = () =>
  createStore(
    rootReducers,
    undefined,
    composeWithDevTools(applyMiddleware(thunk, interviewMediaAuthMiddleware)),
  );

export const store = createAppStore();
export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
