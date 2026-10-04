import { withRouter } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withTranslation } from 'react-i18next';
import cApi from 'Utils/API/c-api';
import Loading from '../../Utils/Loading';
import { loginRedirect } from '../../Utils/authReturn';
import { UrlPrefix } from '../../Config/constValue';
import { AUTH_BOUNDARY_EVENT } from '../../Utils/authBoundary';

let profileRequest: Promise<any> | undefined;

const LoginCheck = (props: any) => {
  const dispatch = useDispatch();
  const isLogin = useSelector((state: any) => state.UserReducer.isLogin);
  const authStatus = useSelector((state: any) => state.UserReducer.authStatus ?? 'unknown');

  useEffect(() => {
    const handleAuthBoundary = () => {
      cApi.clearAcceptanceQueueCache?.();
      dispatch({ type: 'clearRedux' });
      dispatch({ type: 'authCheckFailed' });
    };
    window.addEventListener(AUTH_BOUNDARY_EVENT, handleAuthBoundary);
    return () => window.removeEventListener(AUTH_BOUNDARY_EVENT, handleAuthBoundary);
  }, [dispatch]);

  useEffect(() => {
    if (isLogin === true) return;
    if (authStatus === 'anonymous') {
      if (props.jump && props.location.pathname !== UrlPrefix + '/login') {
        props.history.replace(loginRedirect(props.location));
      }
      return;
    }
    if (!profileRequest) {
      profileRequest = cApi.getProfile().finally(() => {
        profileRequest = undefined;
      });
    }
    let active = true;
    profileRequest
      .then((res: any) => {
        if (!active) return;
        dispatch({ type: 'setUserInfo', data: res });
        dispatch({ type: 'userLogin' });
      })
      .catch(() => {
        if (!active) return;
        dispatch({ type: 'authCheckFailed' });
        if (props.jump) props.history.replace(loginRedirect(props.location));
      });
    return () => {
      active = false;
    };
  }, [authStatus, dispatch, isLogin, props.history, props.jump, props.location]);

  return props.jump && authStatus === 'unknown' ? <Loading /> : null;
};

export default withTranslation()(withRouter(LoginCheck));
