import React, { Dispatch, Suspense, lazy } from 'react';

import './App.css';

import './Config/i18n';
import { ConfigProvider } from 'antd';
import { appTheme } from './Config/theme';
import { useAppSelector } from './Redux/Store/hooks';
import ErrorBoundary from './Utils/ErrorBoundary';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import Loading from './Utils/Loading';
import { routeTrees } from './Config/router/routeTrees';
import RouteSwitch from './Config/router/RouteSwitch';
const SubmissionModal = lazy(() => import('./Component/submission/Processing/ModalProcessing'));
const RequirePassChange = lazy(() => import('./Component/common/RequirePassChange'));

const RoutedContent = () => {
  const location = useLocation();
  return (
    <ErrorBoundary resetKey={location.pathname + location.search + location.hash}>
      <Suspense fallback={<Loading />}>
        <RouteSwitch routes={routeTrees.layout} />
      </Suspense>
    </ErrorBoundary>
  );
};

const App = () => {
  const locale = useAppSelector((state) => state.ConfigReducer.lang);

  return (
    // antd 全局化配置  国际化参数
    <ConfigProvider locale={locale} theme={appTheme}>
      <ErrorBoundary>
        {/*顶级路由*/}
        <Router>
          {/* 提交详情窗体 / 密码修改提示 懒加载，避免首屏引入 */}
          <Suspense fallback={<Loading />}>
            <SubmissionModal />
            <RequirePassChange />
          </Suspense>
          <RoutedContent />
        </Router>
      </ErrorBoundary>
    </ConfigProvider>
  );
};

export default App;
