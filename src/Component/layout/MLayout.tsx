import React, { Suspense, useEffect, useState } from 'react';
import { Drawer, Grid, Layout, Result } from 'antd';
import logo from '../../Assert/img/logo.png';
import MMenu from './MMenu';
import MHeader from './MHeader';
import Loading from '../../Utils/Loading';
import { Route, Switch } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { withRouter } from 'react-router';
import { routerM } from '../../Config/router/routerM';
import { UrlPrefix } from '../../Config/constValue';
import { IRouter } from '../../Config/router/router';
import LoginCheck from '../common/LoginCheck';
import { Role, UserState } from '../../Type/Iuser';
import { connect } from 'react-redux';
import judgeAuth from '../../Utils/judgeAhtu';
import NotFound from '../../Pages/Error/NotFound';

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
      routerM.length !== 0
    ) {
      const firstManageRoute = routerM.find((route) =>
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

  const flattenRoutes = (router: IRouter[]): IRouter[] =>
    router.flatMap((r) => [
      ...(r.component ? [{ ...r, exact: r.children ? true : r.exact }] : []),
      ...(r.children ? flattenRoutes(r.children) : []),
    ]);
  const manageRoutes = flattenRoutes(routerM);
  const hasManageAccess = canAccessManage(props.roles);
  const menu = <MMenu id={1} roles={['superadmin']} />;

  return (
    <>
      <LoginCheck jump={true} />
      {!props.isLogin ? null : !hasManageAccess ? (
        <Result status="403" title={props.t('NoPermission', { defaultValue: '没有权限' })} />
      ) : (
        <Layout style={{ height: 'max-content', minHeight: '100%' }}>
          {isMobile ? (
            <Drawer
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
              theme="dark"
              style={{ position: 'fixed', zIndex: 50, height: '100vh', overflow: 'auto' }}
            >
              <div className="logo">
                <img src={logo} style={{ width: '125px', height: '30px' }} alt="SDUOJ-logo" />
              </div>
              {menu}
            </Sider>
          )}
          <Layout style={{ minWidth: 0, marginLeft: isMobile ? 0 : 200 }}>
            <MHeader isMobile={isMobile} onMenuToggle={() => setMenuOpen(true)} />
            <Content
              style={{
                backgroundColor: '#ffffff',
                paddingTop: 64,
                margin: isMobile ? '20px 8px 0' : '20px 16px 0',
                display: 'block',
                minWidth: 0,
                height: 'auto',
              }}
            >
              <div className="site-layout-background" style={{ padding: isMobile ? 8 : 24 }}>
                <Suspense fallback={<Loading />}>
                  <Switch>
                    {manageRoutes.map((r) => (
                      <Route key={r.id} path={r.path} exact={r.exact} component={r.component} />
                    ))}
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
              </div>
            </Content>
          </Layout>
        </Layout>
      )}
    </>
  );
};

const mapStateToProps = (state: { UserReducer: UserState }) => ({
  isLogin: state.UserReducer.isLogin,
  roles: state.UserReducer.userInfo?.roles,
});

export const canAccessManage = (roles: Role[] | undefined) =>
  judgeAuth(roles, ['admin', 'superadmin']);

export default connect(mapStateToProps)(withTranslation()(withRouter(MLayout)));
