import { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import Login from '../../Component/user/Login';
import { UrlPrefix } from '../../Config/constValue';
import { useAppSelector } from '../../Redux/Store/hooks';
import { returnTo } from '../../Utils/authReturn';

export function loginDestination(search: string, origin: string): string {
  const fallback = UrlPrefix + '/home';
  const requested = new URLSearchParams(search).get('to');
  if (!requested) return fallback;
  try {
    const url = new URL(requested, origin);
    if (
      url.origin !== origin ||
      url.pathname === UrlPrefix + '/login' ||
      (url.pathname !== UrlPrefix && !url.pathname.startsWith(UrlPrefix + '/'))
    )
      return fallback;
    return returnTo({ pathname: url.pathname, search: url.search, hash: url.hash });
  } catch {
    return fallback;
  }
}

export default function CLogin() {
  const isLogin = useAppSelector((state) => state.UserReducer.isLogin);
  const history = useHistory();
  const { search } = useLocation();
  const { t } = useTranslation();
  useEffect(() => {
    if (isLogin === true) {
      history.replace(loginDestination(search, window.location.origin));
      message.success(t('loginSuccessfully'));
    }
  }, [history, isLogin, search, t]);
  return <Login />;
}
