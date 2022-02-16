import {lazy} from "react";
import {IBaseRouter, IRouter} from "./router";

export const routerC: IBaseRouter[] = [
    {
        id: 2,
        path: "/v2/login",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CLogin'))
    },
    {
        id: 3,
        path: "/v2/test",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CTest'))
    },
    {
        id: 4,
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CHome'))
    },
    {
        id: 5,
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblem'))
    },
    {
        id: 51,
        path: "/v2/problem/:ProblemCode",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblemInfo'))
    },
    {
        id: 6,
        path: "/v2/submission",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CSubmissions'))
    },
    {
        id: 7,
        path: "/v2/contest",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CContest'))
    },
    {
        id: 71,
        path: "/v2/contest/:contestId",
        exact: false,
        component: lazy(() => import('../../Pages/Client/CContestInfo'))
    },
    {
        id: 8,
        path: "/v2/group",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CGroup'))
    },
    {
        id: 9,
        path: "/v2/user",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CUser'))
    },
    {
        id: 10,
        path: "/v2/resetpass",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CResetPass'))
    },
    {
        id: 11,
        path: "/v2/thirdPartyLogin",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CThirdPartyLogin'))
    },
]

export const routerC_Contest_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Overview",
        path: "/v2/contest/:contestId/overview",
        exact: true,
        component: lazy(() => import("../../Component/contest/Overview"))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: "/v2/contest/:contestId/problem/:problemCode",
        exact: true,
        component: lazy(() => import("../../Component/contest/Problem"))
    },
    {
        id: 3,
        title_i18n: "Status",
        path: "/v2/contest/:contestId/submission",
        exact: true,
        component: lazy(() => import("../../Component/contest/Status"))
    },
    {
        id: 4,
        title_i18n: "Rank",
        path: "/v2/contest/:contestId/rank",
        exact: true,
        component: lazy(() => import("../../Component/contest/Rank"))
    }
]

// C 端目录
export const routerC_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Home",
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CHome'))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CProblem'))
    },
    {
        id: 3,
        path: "/v2/submission",
        title_i18n: "Submission",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CSubmissions'))
    },
    {
        id: 4,
        path: "/v2/contest",
        title_i18n: "Contest",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CContest'))
    },
    {
        id: 5,
        path: "/v2/group",
        title_i18n: "Group",
        exact: true,
        component: lazy(() => import('../../Pages/Client/CGroup'))
    },
    {
        id: 6,
        path: "/v2/exam/list",
        title_i18n: "Exam System",
        exact: true,
        component: <></>
    },
]