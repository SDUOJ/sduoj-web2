import { lazy } from 'react';
import type { IBaseRouter } from './types';
import { UrlPrefix } from '../constValue';

export const routerE: readonly IBaseRouter[] = [
  {
    id: 2,
    path: UrlPrefix + '/exam/list',
    exact: true,
    component: lazy(() => import('../../Pages/Exam/DeprecatedJavaExam')),
  },
  {
    id: 3,
    path: UrlPrefix + '/exam/wait/:eid',
    exact: true,
    component: lazy(() => import('../../Pages/Exam/DeprecatedJavaExam')),
  },
  {
    id: 4,
    path: UrlPrefix + '/exam/running/:eid/:gid/:pid',
    exact: true,
    component: lazy(() => import('../../Pages/Exam/DeprecatedJavaExam')),
  },
  {
    id: 5,
    path: UrlPrefix + '/exam/finish',
    exact: true,
    component: lazy(() => import('../../Pages/Exam/DeprecatedJavaExam')),
  },
  {
    id: 6,
    path: UrlPrefix + '/exam/report/:eid',
    exact: true,
    component: lazy(() => import('../../Pages/Exam/DeprecatedJavaExam')),
  },
];
