import React, { lazy, Suspense, useState } from 'react';
import { Button, ConfigProvider, Drawer, Spin } from 'antd';
import AIRouteBoundary from './AIRouteBoundary';
import './business-feature.css';
import { developmentFeaturesEnabled } from '../../../Config/developmentFeatures';
import { DevBadge } from '../../../Component/common/DevOnly';

const features = {
  tasks: lazy(() => import('./AIOperations')),
  grading: lazy(() => import('./GradingWorkbench')),
  exams: lazy(() => import('./ExaminationWorkbench')),
  course: lazy(() => import('./CourseKnowledgeWorkbench')),
  plagiarism: lazy(() => import('./PlagiarismWorkbench')),
  interviews: lazy(() => import('./InterviewWorkbench')),
  admin: lazy(() => import('./AIAdmin')),
};
export type FeatureKind = keyof typeof features;

export function FeatureAction({
  feature,
  children,
  context = {},
}: {
  feature: FeatureKind;
  children: React.ReactNode;
  context?: Record<string, string | number | undefined>;
}) {
  const [open, setOpen] = useState(false);
  if (!developmentFeaturesEnabled()) return null;
  const Page = features[feature] as React.ComponentType<any>;
  const query = new URLSearchParams();
  Object.entries(context).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        {children}
        <DevBadge />
      </Button>
      <Drawer
        title={children}
        width="min(1200px, 96vw)"
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
      >
        <div className="business-feature">
          <Suspense fallback={<Spin />}>
            <ConfigProvider componentSize="small">
              <AIRouteBoundary allowSuspended={feature === 'admin'}>
                <Page location={{ search: '?' + query.toString() }} />
              </AIRouteBoundary>
            </ConfigProvider>
          </Suspense>
        </div>
      </Drawer>
    </>
  );
}
