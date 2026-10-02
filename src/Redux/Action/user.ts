import CApi from 'Utils/API/c-api';
import { UserInfo } from '../../Type/Iuser';
import { Dispatch } from 'redux';
import { clearRedux } from './common';

export type UserAction = setUserInfo | userLogin | userLogout | authCheckFailed | clearRedux;

export function userLogoutTodo() {
  return (dispatch: Dispatch<UserAction>): Promise<void> => {
    return CApi.logout().then(() => {
      dispatch({ type: 'userLogout' });
      dispatch({ type: 'clearRedux' });
    });
  };
}

export interface setUserInfo {
  type: 'setUserInfo';
  data: UserInfo;
}

export interface userLogin {
  type: 'userLogin';
}

export interface userLogout {
  type: 'userLogout';
}

export interface authCheckFailed {
  type: 'authCheckFailed';
}
