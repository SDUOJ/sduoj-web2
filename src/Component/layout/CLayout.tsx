import { Suspense, useEffect } from 'react';
import { Layout } from 'antd';
import { matchPath, useHistory, useLocation } from 'react-router-dom';
import Loading from '../../Utils/Loading';
import FooterSDU from './FooterSDU';
import CHeader from './CHeader';
import { routeTrees } from '../../Config/router/routeTrees';
import RouteSwitch from '../../Config/router/RouteSwitch';
import { UrlPrefix } from '../../Config/constValue';
import LoginCheck from '../common/LoginCheck';
import { useAppSelector } from '../../Redux/Store/hooks';
import './clientLayout.css';

export default function CLayout() {
  const history = useHistory();
  const { pathname } = useLocation();
  const rankWidth = useAppSelector((state) => state.ContestReducer.minWidth);
  const authStatus = useAppSelector((state) => state.UserReducer.authStatus ?? 'unknown');
  const isIde = Boolean(
    [
      `${UrlPrefix}/problem/:ProblemCode/ide`,
      `${UrlPrefix}/contest/:contestId/problem/:problemCode/ide`,
      `${UrlPrefix}/problemSet/:problemSetId/problem/:problemGroupId/:problemId/ide`,
    ].some((path) => matchPath(pathname, { path, exact: true })),
  );
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
        <Layout className={`client-layout${isIde ? ' client-layout-ide' : ''}`}>
          <CHeader />
          <Layout.Content className="client-content">
            <div style={{ minWidth: isRank ? Math.max(500, (rankWidth ?? 0) + 100) : 0 }}>
              <Suspense fallback={<Loading />}>
                <RouteSwitch routes={routeTrees.client} />
              </Suspense>
            </div>
          </Layout.Content>
          {!isIde && <FooterSDU />}
        </Layout>
      )}
    </>
  );
}
