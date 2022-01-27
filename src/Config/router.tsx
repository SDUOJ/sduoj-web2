import {lazy} from "react";
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    FileOutlined,
    FolderOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    ReadOutlined,
    NotificationOutlined
} from "@ant-design/icons"


interface IBaseRouter {
    id: number
    path: string
    exact?: boolean
    component: any
}

interface IRouter extends IBaseRouter {
    title_i18n: string
    exact?: boolean
    icon?: any
    children?: IRouter[]
}

export const routerLayout: IBaseRouter[] = [
    {
        id: 0,
        path: "/v2/manage",
        exact: false,
        component: lazy(() => import('../Component/layout/MLayout'))
    },
    {
        id: 1,
        path: "/v2/exam",
        exact: false,
        component: lazy(() => import('../Component/layout/ELayout'))
    },
    {
        id: 2,
        path: "/v2/thirdPartyLogin",
        exact: false,
        component: lazy(() => import('../Pages/thirdPartyLogin'))
    },
    {
        id: 3,
        path: "/v2/c",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 4,
        path: "/v2",
        exact: true,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 5,
        path: "/v2/resetpass",
        exact: true,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 6,
        path: "/v2/home",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 7,
        path: "/v2/problem",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 8,
        path: "/v2/contest",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 9,
        path: "/v2/submission",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 10,
        path: "/v2/user",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 11,
        path: "/v2/group",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 12,
        path: "/v2/login",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 13,
        path: "/v2/test",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 14,
        path: "/v2/error/time",
        exact: true,
        component: lazy(() => import('../Pages/Error/TimeError'))
    },
]


export const routerC: IBaseRouter[] = [
    {
        id: 1,
        path: "/v2/c/build",
        exact: true,
        component: lazy(() => import('../Pages/Client/CBuild'))
    },
    {
        id: 2,
        path: "/v2/login",
        exact: true,
        component: lazy(() => import('../Pages/Client/CLogin'))
    },
    {
        id: 3,
        path: "/v2/test",
        exact: true,
        component: lazy(() => import('../Pages/Client/CTest'))
    },
    {
        id: 4,
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../Pages/Client/CHome'))
    },
    {
        id: 5,
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../Pages/Client/CProblem'))
    },
    {
        id: 6,
        path: "/v2/submission",
        exact: true,
        component: lazy(() => import('../Pages/Client/CSubmissions'))
    },
    {
        id: 7,
        path: "/v2/contest",
        exact: true,
        component: lazy(() => import('../Pages/Client/CContest'))
    },
    {
        id: 8,
        path: "/v2/group",
        exact: true,
        component: lazy(() => import('../Pages/Client/CGroup'))
    },
    {
        id: 9,
        path: "/v2/user",
        exact: true,
        component: lazy(() => import('../Pages/Client/CGroup'))
    },
    {
        id: 10,
        path: "/v2/resetpass",
        exact: true,
        component: lazy(() => import('../Pages/Client/CResetPass'))
    },
]
export const routerC_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Home",
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../Pages/Client/CHome'))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../Pages/Client/CProblem'))
    },
    {
        id: 3,
        path: "/v2/submission",
        title_i18n: "Submission",
        exact: true,
        component: lazy(() => import('../Pages/Client/CSubmissions'))
    },
    {
        id: 4,
        path: "/v2/contest",
        title_i18n: "Contest",
        exact: true,
        component: lazy(() => import('../Pages/Client/CContest'))
    },
    {
        id: 5,
        path: "/v2/group",
        title_i18n: "Group",
        exact: true,
        component: lazy(() => import('../Pages/Client/CGroup'))
    },
    {
        id: 6,
        path: "/v2/exam/list",
        title_i18n: "Exam System",
        exact: true,
        component: <></>
    },
]

export const routerE: IBaseRouter[] = [
    {
        id: 2,
        path: "/v2/exam/list",
        exact: true,
        component: lazy(() => import('../Pages/Exam/EList'))
    },
    {
        id: 3,
        path: "/v2/exam/wait/:eid",
        exact: true,
        component: lazy(() => import('../Pages/Exam/EWait'))
    },
    {
        id: 4,
        path: "/v2/exam/running/:eid",
        exact: true,
        component: lazy(() => import('../Pages/Exam/ERunning'))
    },
    {
        id: 5,
        path: "/v2/exam/finish",
        exact: true,
        component: lazy(() => import('../Pages/Exam/EFinish'))
    }
]


export const routerM: IRouter[] = [
    {
        id: 0,
        path: "/v2/manage/user",
        title_i18n: "user",
        exact: false,
        icon: <UserOutlined/>,
        component: lazy(() => import('../Pages/Manage/MUser'))
    },
    {
        id: 1,
        path: "/v2/manage/problem",
        title_i18n: "problem",
        exact: false,
        icon: <FolderOutlined/>,
        component: lazy(() => import('../Pages/Manage/MProblem'))
    },
    {
        id: 2,
        path: "/v2/manage/contest",
        title_i18n: "contest",
        exact: false,
        icon: <AppstoreOutlined/>,
        component: lazy(() => import('../Pages/Manage/MContest'))
    },
    {
        id: 3,
        path: "/v2/manage/template",
        title_i18n: "template",
        exact: false,
        icon: <FileOutlined/>,
        component: lazy(() => import('../Pages/Manage/MJudgeTemplate'))
    },
    {
        id: 4,
        path: "/v2/manage/group",
        title_i18n: "group",
        exact: false,
        icon: <UsergroupAddOutlined/>,
        component: lazy(() => import('../Pages/Manage/MGroup'))
    },
    {
        id: 5,
        path: "/v2/manage/exam",
        title_i18n: "exam",
        exact: true,
        icon: <ReadOutlined/>,
        component: lazy(() => import('../Pages/Manage/MExam'))
    },
    {
        id: 6,
        path: "/v2/manage/objective",
        title_i18n: "objective",
        exact: true,
        icon: <CheckCircleOutlined/>,
        component: lazy(() => import('../Pages/Manage/MObjective'))
    },
    {
        id: 7,
        path: "/v2/manage/announcement",
        title_i18n: "Announcement",
        exact: true,
        icon: <NotificationOutlined />,
        component: lazy(() => import('../Pages/Manage/MAnnouncement'))
    }
]

export function getRouterPath(router: any[], id: number) {
    for (const x of router) {
        if (x.id === id) return x.path
    }
    return ''
}
