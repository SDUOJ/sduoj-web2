import { Suspense, useEffect } from 'react';
import { Layout } from 'antd';
import { Route, Switch, useHistory, useLocation } from 'react-router-dom';
import Loading from '../../Utils/Loading';
import FooterSDU from './FooterSDU';
import CHeader from './CHeader';
import { routerC } from '../../Config/router/routerC';
import { UrlPrefix } from '../../Config/constValue';
import LoginCheck from '../common/LoginCheck';
import { useAppSelector } from '../../Redux/Store/hooks';
import './clientLayout.css';
import NotFound from '../../Pages/Error/NotFound';

export default function CLayout() {
  const history = useHistory();
  const { pathname } = useLocation();
  const rankWidth = useAppSelector((state) => state.ContestReducer.minWidth);
  const authStatus = useAppSelector((state) => state.UserReducer.authStatus ?? 'unknown');
  const isRank = /\/contest\/.*\/rank/.test(pathname);

  useEffect(() => {
    if (pathname === UrlPrefix || pathname === UrlPrefix + '/')
      history.replace(UrlPrefix + '/home');
  }, [history, pathname]);

  return (
    <>
      <LoginCheck />
      {authStatus === 'unknown' && pathname !== UrlPrefix + '/login' ? (
        <Loading />
      ) : (
        <Layout className="client-layout">
          <CHeader />
          <Layout.Content className="client-content">
            <div style={{ minWidth: isRank ? Math.max(500, (rankWidth ?? 0) + 100) : 0 }}>
              <Suspense fallback={<Loading />}>
                <Switch>
                  {routerC.map(({ id, path, exact, component }) => (
                    <Route key={id} path={path} exact={exact} component={component} />
                  ))}
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </div>
          </Layout.Content>
          <FooterSDU />
        </Layout>
      )}
    </>
  );
}
