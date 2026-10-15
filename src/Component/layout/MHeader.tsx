import React from 'react';
import { Button, Layout, message } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import ChangeLang from '../common/ChangeLang';
import { UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import UserAccountDropdown from './UserAccountDropdown';
import { userLogoutTodo } from '../../Redux/Action/user';
import { UrlPrefix } from '../../Config/constValue';
import { loginRedirect } from '../../Utils/authReturn';
import { routeTrees } from '../../Config/router/routeTrees';
import { DevBadge } from '../common/DevOnly';

const { Header } = Layout;

const MHeader = (props: any) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();
  const isMobile = props.isMobile === true;
  const currentRoute = routeTrees.manage
    .filter((route) => matchPath(location.pathname, { path: route.path, exact: false }))
    .sort((left, right) => right.path.length - left.path.length)[0];

  return (
    <Header
      className="site-layout-sub-header-background manage-header"
      style={{
        minWidth: 0,
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 200,
        width: isMobile ? '100%' : 'calc(100% - 200px)',
        display: 'flex',
        alignItems: 'center',
        height: 64,
        padding: isMobile ? '0 8px' : '0 20px',
        boxSizing: 'border-box',
        zIndex: 100,
      }}
    >
      {isMobile && (
        <Button
          type="text"
          icon={<MenuOutlined />}
          aria-label={t('openMenu', { defaultValue: 'Open menu' })}
          onClick={props.onMenuToggle}
        />
      )}
      <div className="manage-page-context">
        <span className="manage-page-section">{t('Manage', { defaultValue: '管理' })}</span>
        {currentRoute && <span className="manage-page-title">{t(currentRoute.title_i18n)}</span>}
        {currentRoute?.devOnly && <DevBadge />}
      </div>
      <div
        className="mheader-ops"
        style={{ display: 'flex', gap: isMobile ? 8 : 24, alignItems: 'center', flexShrink: 0 }}
      >
        <ChangeLang />
        {props.isLogin ? (
          <UserAccountDropdown
            isLogin={true}
            mode="manage"
            username={props.username}
            email={props.email}
            roles={props.roles}
            onBackToOJ={() => history.push(UrlPrefix + '/')}
            onToManage={undefined}
            onToProfile={() => history.push(UrlPrefix + '/user')}
            onLogout={async () => {
              try {
                await props.userLogout();
                history.push(UrlPrefix + '/home');
                message.info(t('LogoutSuccess', { defaultValue: t('Logout') }));
              } catch {
                // Transport reports the failed logout.
              }
            }}
          />
        ) : (
          <Button
            type="text"
            onClick={() => {
              const loginPath = UrlPrefix + '/login';
              const { pathname, search, hash } = location;
              // 如果已经在登录页，则不要修改已有重定向地址（也不再跳转）
              if (pathname === loginPath) return;
              history.push(loginRedirect({ pathname, search, hash }));
            }}
          >
            {t('LoginOrRegister', {
              defaultValue: t('Login') + ' / ' + t('Register'),
            })}
          </Button>
        )}
      </div>
    </Header>
  );
};

const mapStateToProps = (state: any) => {
  const UState: UserState = state.UserReducer;
  return {
    isLogin: UState.isLogin,
    email: UState.userInfo?.email,
    username: UState.userInfo?.username,
    roles: UState.userInfo?.roles,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  userLogout: () => dispatch(userLogoutTodo()),
});

export default connect(mapStateToProps, mapDispatchToProps)(MHeader);
