import React, { lazy } from 'react';
import { ConfigProvider } from 'antd';
import '../../Pages/Manage/AI/business-feature.css';
import AIRouteBoundary from '../../Pages/Manage/AI/AIRouteBoundary';
import type { RouteLocationProps } from './types';

export function aiPage(load: () => Promise<{ default: React.ComponentType<RouteLocationProps> }>) {
  const Page = lazy(load);
  return function AuthorizedAIPage(props: RouteLocationProps) {
    return (
      <div className="business-feature">
        <ConfigProvider componentSize="small">
          <AIRouteBoundary>
            <Page {...props} />
          </AIRouteBoundary>
        </ConfigProvider>
      </div>
    );
  };
}
