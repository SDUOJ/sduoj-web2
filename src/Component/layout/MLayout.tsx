import React, { Suspense, useEffect, useState } from 'react';
import { ConfigProvider, Drawer, Grid, Layout, Result } from 'antd';
import logo from '../../Assert/img/logo.png';
import MMenu from './MMenu';
import MHeader from './MHeader';
import Loading from '../../Utils/Loading';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { routeTrees } from '../../Config/router/routeTrees';
import RouteSwitch from '../../Config/router/RouteSwitch';
import { UrlPrefix } from '../../Config/constValue';
import LoginCheck from '../common/LoginCheck';
import { Role, UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import judgeAuth from '../../Utils/judgeAhtu';
import { manageTheme } from '../../Config/theme';
import './manageLayout.css';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const MLayout = (props: any) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (
      (props.location.pathname === UrlPrefix + '/manage' ||
        props.location.pathname === UrlPrefix + '/manage/') &&
      routeTrees.manage.length !== 0
    ) {
      const firstManageRoute = routeTrees.manage.find((route) =>
        route.path.startsWith(UrlPrefix + '/manage/'),
      );
      if (firstManageRoute) {
        props.history.replace({
          pathname: firstManageRoute.path,
          search: props.location.search,
          hash: props.location.hash,
        });
      }
    }
  }, [props.history, props.location.hash, props.location.pathname, props.location.search]);

  useEffect(() => {
    setMenuOpen(false);
  }, [props.location.pathname, isMobile]);

  const hasManageAccess = canAccessManage(props.roles);
  const menu = <MMenu id={1} roles={['superadmin']} />;

  return (
    <ConfigProvider theme={manageTheme}>
      <LoginCheck jump={true} />
      {!props.isLogin ? null : !hasManageAccess ? (
        <Result status="403" title={props.t('NoPermission', { defaultValue: '没有权限' })} />
      ) : (
        <Layout className="manage-layout" style={{ height: 'max-content', minHeight: '100%' }}>
          {isMobile ? (
            <Drawer
              rootClassName="manage-drawer"
              title={<img src={logo} style={{ width: '125px', height: '30px' }} alt="SDUOJ-logo" />}
              placement="left"
              width={240}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              styles={{ body: { padding: 0 }, header: { padding: '12px 16px' } }}
            >
              {menu}
            </Drawer>
          ) : (
            <Sider
              theme="light"
              className="manage-sidebar"
              style={{ position: 'fixed', zIndex: 50, height: '100vh', overflow: 'auto' }}
            >
              <div className="manage-brand">
                <img src={logo} style={{ width: '125px', height: '30px' }} alt="SDUOJ-logo" />
              </div>
              {menu}
            </Sider>
          )}
          <Layout className="manage-main" style={{ minWidth: 0, marginLeft: isMobile ? 0 : 200 }}>
            <MHeader isMobile={isMobile} onMenuToggle={() => setMenuOpen(true)} />
            <Content
              className="manage-content"
              style={{
                display: 'block',
                minWidth: 0,
                height: 'auto',
              }}
            >
              <div className="manage-surface">
                <Suspense fallback={<Loading />}>
                  <RouteSwitch routes={routeTrees.manage} />
                </Suspense>
              </div>
            </Content>
          </Layout>
        </Layout>
      )}
    </ConfigProvider>
  );
};

const mapStateToProps = (state: { UserReducer: UserState }) => ({
  isLogin: state.UserReducer.isLogin,
  roles: state.UserReducer.userInfo?.roles,
});

export const canAccessManage = (roles: Role[] | undefined) =>
  judgeAuth(roles, ['admin', 'superadmin']);

export default connect(mapStateToProps)(withTranslation()(withRouter(MLayout)));
