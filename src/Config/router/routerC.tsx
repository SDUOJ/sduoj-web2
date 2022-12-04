import {lazy} from "react";
import {IBaseRouter, IRouter} from "./router";
import {UrlPrefix} from "../constValue";

export const routerC: IBaseRouter[] = [
    {
        id: 2,
        path: UrlPrefix + "/login",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CLogin'))
    },
    {
        id: 3,
        path: UrlPrefix + "/test",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CTest'))
    },
    {
        id: 4,
        path: UrlPrefix + "/home",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CHome'))
    },
    {
        id: 5,
        path: UrlPrefix + "/problem",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblem'))
    },
    {
        id: 51,
        path: UrlPrefix + "/problem/:ProblemCode",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblemInfo'))
    },
    {
        id: 6,
        path: UrlPrefix + "/submission",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CSubmissions'))
    },
    {
        id: 7,
        path: UrlPrefix + "/contest",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CContest'))
    },
    {
        id: 71,
        path: UrlPrefix + "/contest/:contestId",
        exact: false,
        component: lazy(() => import('../../Pages/Client/CContestInfo'))
    },
    {
        id: 8,
        path: UrlPrefix + "/group",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CGroup'))
    },
    {
        id: 81,
        path: UrlPrefix + "/group/:groupId",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CGroupInfo'))
    },
    {
        id: 9,
        path: UrlPrefix + "/user",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CUser'))
    },
    {
        id: 10,
        path: UrlPrefix + "/resetpass",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CResetPass'))
    },
    {
        id: 11,
        path: UrlPrefix + "/thirdPartyLogin",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CThirdPartyLogin'))
    },
    {
        id: 12,
        path: UrlPrefix + "/problemSet/:problemSetId",
        exact: false,
        component: lazy(() => import('../../Pages/Client/ProblemSet/Info'))
    },
    {
        id: 7359,
        path: UrlPrefix + "/hws",
        exact: true,
        component: lazy(() => import('../../Pages/Ext/Ext-Hws'))
    },
    {
        id: 7360,
        path: UrlPrefix + "/hws/:cid",
        exact: true,
        component: lazy(() => import('../../Pages/Ext/Ext-HwsInfo'))
    },
]

export const routerC_Contest_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Overview",
        path: UrlPrefix + "/contest/:contestId/overview",
        exact: true,
        component: lazy(() => import("../../Component/contest/Overview"))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: UrlPrefix + "/contest/:contestId/problem/:problemCode",
        exact: true,
        component: lazy(() => import("../../Component/contest/Problem"))
    },
    {
        id: 3,
        title_i18n: "Status",
        path: UrlPrefix + "/contest/:contestId/submission",
        exact: true,
        component: lazy(() => import("../../Component/contest/Status"))
    },
    {
        id: 4,
        title_i18n: "Rank",
        path: UrlPrefix + "/contest/:contestId/rank",
        exact: true,
        component: lazy(() => import("../../Component/contest/Rank"))
    },
    {
        id: 5,
        title_i18n: "Register",
        path: UrlPrefix + "/contest/:contestId/register",
        exact: true,
        component: lazy(()=> import("../../Component/contest/Register"))
    }
]

export const routerC_ProblemSet_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Overview",
        path: UrlPrefix + "/problemSet/:problemSetId/overview",
        exact: true,
        component: lazy(() => import("../../Component/problemSet/Overview"))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: UrlPrefix + "/problemSet/:problemSetId/problem/:problemGroupId/:problemId",
        exact: true,
        component: lazy(() => import("../../Component/problemSet/Problem"))
    },
    {
        id: 3,
        title_i18n: "Rank",
        path: UrlPrefix + "/contest/:problemSetId/rank",
        exact: true,
        component: lazy(() => import("../../Component/problemSet/Rank"))
    },
]

// C 端目录
export const routerC_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Home",
        path: UrlPrefix + "/home",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CHome'))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: UrlPrefix + "/problem",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblem'))
    },
    {
        id: 3,
        path: UrlPrefix + "/submission",
        title_i18n: "Submission",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CSubmissions'))
    },
    {
        id: 4,
        path: UrlPrefix + "/contest",
        title_i18n: "Contest",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CContest'))
    },
    {
        id: 5,
        path: UrlPrefix + "/group",
        title_i18n: "Group",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CGroup'))
    },
    {
        id: 6,
        path: UrlPrefix + "/hws",
        title_i18n: "文件提交",
        exact: true,
        component: lazy(() => import('../../Pages/Ext/Ext-Hws'))
    },
    {
        id: 7,
        path: UrlPrefix + "/exam",
        title_i18n: "考试系统",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EList'))
    },
]