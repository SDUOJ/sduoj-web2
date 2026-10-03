import { Route, withRouter } from 'react-router-dom';
import PSHeader from './PSHeader';
import Loading from '../../Utils/Loading';
import { router_ProblemSet } from '../../Config/router/routerC';
import React, { Dispatch, Suspense, useEffect, useState } from 'react';
import LoginCheck from '../common/LoginCheck';
import { useSelector } from 'react-redux';
import { ContestState } from '../../Redux/Action/contest';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { WaterMark } from '@ant-design/pro-layout';
import { UserState } from '../../Type/Iuser';
import ErrorBoundary from '../../Utils/ErrorBoundary';
import QRFloat from '../autolab/QRFloat';

const PSLayout = (props: any) => {
  // const path = props.location.pathname
  let minWidth = 500;

  const [pageWidth, setPageWidth] = useState<number>(
    document.querySelector('body')?.clientWidth as number,
  );
  const authStatus = useSelector((state: any) => state.UserReducer.authStatus ?? 'unknown');

  const handleResize = (e: any) => {
    setPageWidth(e.target.innerWidth);
  };
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (props.location.pathname.match(/\/problemSet\/.*\/rank/g) !== null) {
    minWidth = Math.max(500, (props.minWidth ?? 0) + 100);
  }

  const psMatch = props.location.pathname.match(/\/problemSet\/(\d+)/);
  const problemSetId = psMatch ? psMatch[1] : undefined;

  const content = (
    <ErrorBoundary>
      <PSHeader />
      <Suspense fallback={<Loading />}>
        {router_ProblemSet.map(({ id, path, exact, component }) => (
          <Route key={id} path={path} exact={exact} component={component} />
        ))}
      </Suspense>
    </ErrorBoundary>
  );

  return (
    <>
      <LoginCheck jump={true} />
      {authStatus === 'authenticated' && (
        <div style={minWidth <= 1500 ? { textAlign: 'center', margin: '0 auto' } : undefined}>
          <div
            style={
              minWidth <= 1500
                ? {
                    textAlign: 'left',
                    maxWidth: '1500px',
                    margin: '0 auto',
                  }
                : {
                    textAlign: 'left',
                    maxWidth: '1500px',
                    marginLeft: Math.max(0, ((pageWidth as number) - minWidth) / 2),
                  }
            }
          >
            <WaterMark
              rotate={-25}
              gapX={200}
              gapY={200}
              offsetLeft={20}
              content={props.realName + ' ' + props.sduId}
              fontColor="rgba(212, 212, 212, 0.5)"
              fontSize={18}
              zIndex={500}
            >
              {content}
            </WaterMark>
            {problemSetId && props.username && (
              <QRFloat problemSetId={problemSetId} username={props.username} />
            )}
          </div>
        </div>
      )}
    </>
  );
};
const mapStateToProps = (state: any) => {
  const State: ContestState = state.ContestReducer;
  const UState: UserState = state.UserReducer;
  return {
    minWidth: State.minWidth,
    realName: UState.userInfo?.nickname,
    sduId: UState.userInfo?.username,
    username: UState.userInfo?.username,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(withRouter(PSLayout)));
