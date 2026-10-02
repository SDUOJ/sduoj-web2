import { lazy } from 'react';
import { Redirect } from 'react-router-dom';

import { UrlPrefix } from '../constValue';

export interface IBaseRouter {
  id: number;
  path: string;
  exact?: boolean;
  component?: any;
}

export interface IRouter extends IBaseRouter {
  title_i18n: string;
  exact?: boolean;
  icon?: any;
  children?: IRouter[];
}

// 名称，是否为独立页面
const routerCLayoutData: any = [
  ['home', false],
  ['workspace', false],
  ['courses', false],
  ['practice', false],
  ['account', false],
  ['problem', false],
  ['contest', false],
  ['problemSet', false],
  ['problemSetPublic', false],
  ['submission', false],
  ['group', false],
  // 用户信息页面
  ['user', true],
  // 账户相关的单独页面
  ['login', true],
  ['thirdPartyLogin', true],
  ['resetpass', true],
  ['test', false],
  ['hws', false],
  ['studentMutualEvaluation', true],
];
let routerCLayout: IBaseRouter[] = [];
let num = 100;
for (const x of routerCLayoutData) {
  num += 1;
  routerCLayout.push({
    id: num,
    path: UrlPrefix + '/' + x[0],
    exact: x[1],
    component: lazy(() => import('../../Component/layout/CLayout')),
  });
}

export const routerLayout: IBaseRouter[] = [
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
    component: (props: any) => (
      <Redirect to={{ pathname: UrlPrefix + '/workspace', search: props.location.search }} />
    ),
  },
  {
    id: 9101,
    path: UrlPrefix + '/ai-bank',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/problem_group',
          search: props.location.search,
        }}
      />
    ),
  },
  {
    id: 9102,
    path: UrlPrefix + '/ai-authoring',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/intelligent',
          search: props.location.search,
        }}
      />
    ),
  },
  {
    id: 9103,
    path: UrlPrefix + '/ai-grading',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{ pathname: UrlPrefix + '/manage/problemSet/grading', search: props.location.search }}
      />
    ),
  },
  {
    id: 9104,
    path: UrlPrefix + '/ai-exams',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{ pathname: UrlPrefix + '/manage/problemSet/exams', search: props.location.search }}
      />
    ),
  },
  {
    id: 9105,
    path: UrlPrefix + '/ai-course',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{ pathname: UrlPrefix + '/courses/knowledge', search: props.location.search }}
      />
    ),
  },
  {
    id: 9106,
    path: UrlPrefix + '/ai-plagiarism',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{
          pathname: UrlPrefix + '/manage/problemSet/plagiarism',
          search: props.location.search,
        }}
      />
    ),
  },
  {
    id: 9107,
    path: UrlPrefix + '/ai-interviews',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{ pathname: UrlPrefix + '/practice/interviews', search: props.location.search }}
      />
    ),
  },
  {
    id: 9108,
    path: UrlPrefix + '/ai-admin',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={{ pathname: UrlPrefix + '/account/assistant', search: props.location.search }}
      />
    ),
  },
  {
    id: 9199,
    path: UrlPrefix + '/ai-interviews/:id',
    exact: true,
    component: (props: any) => (
      <Redirect
        to={UrlPrefix + '/practice/interviews/' + props.match.params.id + props.location.search}
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

export function getRouterPath(router: any[], id: number) {
  for (const x of router) {
    if (x.id === id) return x.path;
  }
  return '';
}
