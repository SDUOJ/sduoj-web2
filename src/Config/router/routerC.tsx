import { lazy } from 'react';
import { aiPage } from './ai-page';
import { IBaseRouter, IRouter } from './router';
import { UrlPrefix } from '../constValue';

export const routerC: IBaseRouter[] = [
  {
    id: 9300,
    path: UrlPrefix + '/workspace',
    exact: true,
    component: aiPage(() => import('../../Pages/Manage/AI/AIOperations')),
  },
  {
    id: 9301,
    path: UrlPrefix + '/courses/knowledge',
    exact: true,
    component: aiPage(() => import('../../Pages/Manage/AI/CourseKnowledgeWorkbench')),
  },
  {
    id: 9302,
    path: UrlPrefix + '/practice/interviews/:id',
    exact: true,
    component: aiPage(() => import('../../Pages/Manage/AI/InterviewSession')),
  },
  {
    id: 9303,
    path: UrlPrefix + '/practice/interviews',
    exact: true,
    component: aiPage(() => import('../../Pages/Manage/AI/InterviewWorkbench')),
  },
  {
    id: 9304,
    path: UrlPrefix + '/account/assistant',
    exact: true,
    component: aiPage(() => import('../../Pages/Manage/AI/AIAdmin')),
  },
  {
    id: 2,
    path: UrlPrefix + '/login',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CLogin')),
  },
  // {
  //     id: 3,
  //     path: UrlPrefix + "/test",
  //     exact: true,
  //     component: lazy(() => import('../../Pages/Client/CTest'))
  // },
  {
    id: 4,
    path: UrlPrefix + '/home',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CHome')),
  },
  {
    id: 5,
    path: UrlPrefix + '/problem',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CProblem')),
  },
  {
    id: 51,
    path: UrlPrefix + '/problem/:ProblemCode',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CProblemInfo')),
  },
  {
    id: 6,
    path: UrlPrefix + '/submission',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CSubmissions')),
  },
  {
    id: 7,
    path: UrlPrefix + '/contest',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CContest')),
  },
  {
    id: 71,
    path: UrlPrefix + '/contest/:contestId',
    exact: false,
    component: lazy(() => import('../../Pages/Client/CContestInfo')),
  },
  {
    id: 8,
    path: UrlPrefix + '/group',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CGroup')),
  },
  {
    id: 81,
    path: UrlPrefix + '/group/:groupId',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CGroupInfo')),
  },
  {
    id: 9,
    path: UrlPrefix + '/user',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CUser')),
  },
  {
    id: 10,
    path: UrlPrefix + '/resetpass',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CResetPass')),
  },
  {
    id: 11,
    path: UrlPrefix + '/thirdPartyLogin',
    exact: true,
    component: lazy(() => import('../../Pages/Client/CThirdPartyLogin')),
  },
  {
    id: 12,
    path: UrlPrefix + '/problemSet/:problemSetId',
    exact: false,
    component: lazy(() => import('../../Component/problemSet/PSLayout')),
  },
  {
    id: 13,
    path: UrlPrefix + '/problemSetPublic/:problemSetId',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Public')),
  },
  // {
  //     id: 7361,
  //     path: UrlPrefix + "/studentMutualEvaluation",
  //     exact: true,
  //     component: lazy(() => import("../../Pages/Client/CStudentMutualEvaluation"))
  // },
  // {
  //     id: 7359,
  //     path: UrlPrefix + "/hws",
  //     exact: true,
  //     component: lazy(() => import('../../Pages/Ext/Ext-Hws'))
  // },
  // {
  //     id: 7360,
  //     path: UrlPrefix + "/hws/:cid",
  //     exact: true,
  //     component: lazy(() => import('../../Pages/Ext/Ext-HwsInfo'))
  // },
];

export const router_ProblemSet: IBaseRouter[] = [
  {
    id: 13,
    path: UrlPrefix + '/problemSet/:problemSetId/overview',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Overview')),
  },
  {
    id: 14,
    path: UrlPrefix + '/problemSet/:problemSetId/problem/:problemGroupId/:problemId',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Problem')),
  },
  {
    id: 15,
    path: UrlPrefix + '/problemSet/:problemSetId/rank',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Rank')),
  },
  {
    id: 151,
    path: UrlPrefix + '/problemSet/:problemSetId/monitor',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Monitor')),
  },
  {
    id: 16,
    path: UrlPrefix + '/problemSet/:problemSetId/review',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Review')),
  },
  {
    id: 17,
    path: UrlPrefix + '/problemSet/:problemSetId/submission',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/Submission')),
  },
  {
    id: 18,
    path: UrlPrefix + '/problemSet/:problemSetId/late',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/LatePermission')),
  },
  {
    id: 19,
    path: UrlPrefix + '/problemSet/:problemSetId/auto-task',
    exact: true,
    component: lazy(() => import('../../Component/problemSet/AutoTask')),
  },
];

export const routerC_Contest_M: IRouter[] = [
  {
    id: 1,
    title_i18n: 'Overview',
    path: UrlPrefix + '/contest/:contestId/overview',
    exact: true,
    component: lazy(() => import('../../Component/contest/Overview')),
  },
  {
    id: 2,
    title_i18n: 'Problem',
    path: UrlPrefix + '/contest/:contestId/problem/:problemCode',
    exact: true,
    component: lazy(() => import('../../Component/contest/Problem')),
  },
  {
    id: 3,
    title_i18n: 'Status',
    path: UrlPrefix + '/contest/:contestId/submission',
    exact: true,
    component: lazy(() => import('../../Component/contest/Status')),
  },
  {
    id: 4,
    title_i18n: 'Rank',
    path: UrlPrefix + '/contest/:contestId/rank',
    exact: true,
    component: lazy(() => import('../../Component/contest/Rank')),
  },
  {
    id: 5,
    title_i18n: 'Register',
    path: UrlPrefix + '/contest/:contestId/register',
    exact: true,
    component: lazy(() => import('../../Component/contest/Register')),
  },
];

// The desktop/mobile navigation is projected from the canonical client route
// table above. Keeping path and component in one place prevents the menu from
// silently drifting away from the route that it links to.
const clientNavigation = [
  { id: 4, title_i18n: 'Home' },
  { id: 5, title_i18n: 'Problem' },
  { id: 6, title_i18n: 'Submission' },
  { id: 7, title_i18n: 'Contest' },
  { id: 8, title_i18n: 'Group' },
] as const;

export const routerC_M: IRouter[] = clientNavigation.map(({ id, title_i18n }) => {
  const route = routerC.find((candidate) => candidate.id === id);
  if (!route) {
    throw new Error(`Missing client navigation route ${id}`);
  }
  return { ...route, title_i18n };
});
