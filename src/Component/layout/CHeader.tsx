import { Button, Layout, Menu, message } from 'antd';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChangeLang from '../common/ChangeLang';
import logo from '../../Assert/img/logo.png';
import { userLogoutTodo } from '../../Redux/Action/user';
import { useAppDispatch, useAppSelector } from '../../Redux/Store/hooks';
import UserAccountDropdown from './UserAccountDropdown';
import { routerC_M } from '../../Config/router/routerC';
import { UrlPrefix } from '../../Config/constValue';
import { loginRedirect } from '../../Utils/authReturn';

export default function CHeader() {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isLogin, userInfo } = useAppSelector((state) => state.UserReducer);
  const selected = routerC_M.find(
    (route) => location.pathname === route.path || location.pathname.startsWith(route.path + '/'),
  );

  const logout = async () => {
    try {
      await dispatch(userLogoutTodo());
      history.push(UrlPrefix + '/home');
      message.info(t('LogoutSuccess', { defaultValue: t('Logout') }));
    } catch {
      // Transport reports the failed logout; retain the current route and session display.
    }
  };

  return (
    <Layout.Header className="site-layout-sub-header-background client-header">
      <Link className="client-logo" to={UrlPrefix + '/home'}>
        <img src={logo} width={125} height={30} alt="SDUOJ-logo" />
      </Link>
      <nav className="client-navigation" aria-label={t('navigation', { defaultValue: '主导航' })}>
        <Menu
          mode="horizontal"
          theme="light"
          selectedKeys={selected ? [String(selected.id)] : []}
          items={routerC_M.map((route) => ({
            key: String(route.id),
            icon: route.icon,
            label: <Link to={route.path}>{t(route.title_i18n)}</Link>,
          }))}
        />
      </nav>
      <div className="client-header-actions">
        <ChangeLang />
        {isLogin ? (
          <UserAccountDropdown
            isLogin
            mode="console"
            username={userInfo?.username}
            email={userInfo?.email ?? undefined}
            roles={userInfo?.roles}
            onToManage={() => history.push(UrlPrefix + '/manage')}
            onToProfile={() => history.push(UrlPrefix + '/user')}
            onLogout={logout}
          />
        ) : (
          <Button
            type="text"
            onClick={() => {
              const loginPath = UrlPrefix + '/login';
              if (location.pathname !== loginPath) {
                history.push(loginRedirect(location));
              }
            }}
          >
            {t('LoginOrRegister', { defaultValue: t('Login') + ' / ' + t('Register') })}
          </Button>
        )}
      </div>
    </Layout.Header>
  );
}
