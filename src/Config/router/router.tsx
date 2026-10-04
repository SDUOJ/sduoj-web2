import { lazy } from 'react';
import { Redirect } from 'react-router-dom';

import { UrlPrefix } from '../constValue';
import { routerC } from './routerC';
import { projectClientLayouts } from './layoutProjection';
import type { IBaseRouter, RouteLocationProps } from './types';
export type { IBaseRouter, IRouter } from './types';

const clientLayout = lazy(() => import('../../Component/layout/CLayout'));
const routerCLayout = projectClientLayouts(routerC, UrlPrefix, clientLayout);

export const routerLayout: readonly IBaseRouter[] = [
  {
    id: 9490,
    path: UrlPrefix + '/manage/problem/program/authoring',
    exact: true,
    component: () => <Redirect to={UrlPrefix + '/manage/intelligent'} />,
  },
  {
    id: 9100,
    path: UrlPrefix + '/ai-workbench',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/workspace',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9101,
    path: UrlPrefix + '/ai-bank',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/problem_group',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9102,
    path: UrlPrefix + '/ai-authoring',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/intelligent',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9103,
    path: UrlPrefix + '/ai-grading',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/grading',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9104,
    path: UrlPrefix + '/ai-exams',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/exams',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9105,
    path: UrlPrefix + '/ai-course',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/courses/knowledge',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9106,
    path: UrlPrefix + '/ai-plagiarism',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/plagiarism',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9107,
    path: UrlPrefix + '/ai-interviews',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/practice/interviews',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9108,
    path: UrlPrefix + '/ai-admin',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/account/assistant',
          search: props.location.search,
          hash: props.location.hash,
        }}
      />
    ),
  },
  {
    id: 9199,
    path: UrlPrefix + '/ai-interviews/:id',
    exact: true,
    component: (props: RouteLocationProps) => (
      <Redirect
        to={
          UrlPrefix +
          '/practice/interviews/' +
          encodeURIComponent(props.match.params.id ?? '') +
          props.location.search +
          props.location.hash
        }
      />
    ),
  },
  // Layout 大块
  {
    id: 0,
    path: UrlPrefix + '/manage',
    exact: false,
    component: lazy(() => import('../../Component/layout/MLayout')),
  },
  {
    id: 1,
    path: UrlPrefix + '/exam',
    exact: false,
    component: lazy(() => import('../../Component/layout/ELayout')),
  },
  {
    id: 4,
    path: UrlPrefix,
    exact: true,
    component: lazy(() => import('../../Component/layout/CLayout')),
  },
  ...routerCLayout,
  {
    id: 14,
    path: UrlPrefix + '/error/time',
    exact: true,
    component: lazy(() => import('../../Pages/Error/TimeError')),
  },
  {
    id: 15,
    path: UrlPrefix + '/error/browser',
    exact: true,
    component: lazy(() => import('../../Pages/Error/BrowserVersionError')),
  },
  // {
  //     id: 998244353,
  //     path: UrlPrefix + "/summary/2022cxsjswysj",
  //     exact: true,
  //     component: lazy(() => import('../../Pages/Temp/TSummary'))
  // },
  // {
  //     id: 998244354,
  //     path: UrlPrefix + "/contestSubmissionCancel",
  //     exact: true,
  //     component: lazy(() => import('../../Pages/Temp/TCancel'))
  // },
  // {
  //     id: 16,
  //     path: UrlPrefix + "/review/:problemSetId/:problemGroup/:problemId/:userId",
  //     exact: false,
  //     component: lazy(() => import('../../Pages/Client/Review'))
  // },
];

export function getRouterPath<T extends Pick<IBaseRouter, 'id' | 'path'>>(
  router: readonly T[],
  id: number,
) {
  for (const x of router) {
    if (x.id === id) return x.path;
  }
  return '';
}
