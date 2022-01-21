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
]


export const routerC: IBaseRouter[] = [
    {
        id: 1,
        path: "/v2/c/build",
        exact: true,
        component: lazy(() => import('../Pages/CBuild'))
    },
    {
        id: 2,
        path: "/v2/login",
        exact: true,
        component: lazy(() => import('../Pages/ALogin'))
    },
    {
        id: 3,
        path: "/v2/test",
        exact: true,
        component: lazy(() => import('../Pages/CTest'))
    },
    {
        id: 4,
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../Pages/CHome'))
    },
    {
        id: 5,
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../Pages/CProblem'))
    },
    {
        id: 6,
        path: "/v2/submission",
        exact: true,
        component: lazy(() => import('../Pages/CSubmissions'))
    },
    {
        id: 7,
        path: "/v2/contest",
        exact: true,
        component: lazy(() => import('../Pages/CContest'))
    },
    {
        id: 8,
        path: "/v2/group",
        exact: true,
        component: lazy(() => import('../Pages/CGroup'))
    },
    {
        id: 9,
        path: "/v2/user",
        exact: true,
        component: lazy(() => import('../Pages/CGroup'))
    },
    {
        id: 10,
        path: "/v2/resetpass",
        exact: true,
        component: lazy(() => import('../Pages/AResetPass'))
    },
]
export const routerC_M: IRouter[] = [
    {
        id: 1,
        title_i18n: "Home",
        path: "/v2/home",
        exact: true,
        component: lazy(() => import('../Pages/CHome'))
    },
    {
        id: 2,
        title_i18n: "Problem",
        path: "/v2/problem",
        exact: true,
        component: lazy(() => import('../Pages/CProblem'))
    },
    {
        id: 3,
        path: "/v2/submission",
        title_i18n: "Submission",
        exact: true,
        component: lazy(() => import('../Pages/CSubmissions'))
    },
    {
        id: 4,
        path: "/v2/contest",
        title_i18n: "Contest",
        exact: true,
        component: lazy(() => import('../Pages/CContest'))
    },
    {
        id: 5,
        path: "/v2/group",
        title_i18n: "Group",
        exact: true,
        component: lazy(() => import('../Pages/CGroup'))
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
        id: 1,
        path: "/v2/exam/login",
        exact: true,
        component: lazy(() => import('../Pages/ALogin'))
    },
    {
        id: 2,
        path: "/v2/exam/list",
        exact: true,
        component: lazy(() => import('../Pages/EList'))
    },
    {
        id: 3,
        path: "/v2/exam/wait/:eid",
        exact: true,
        component: lazy(() => import('../Pages/EWait'))
    },
    {
        id: 4,
        path: "/v2/exam/running/:eid",
        exact: true,
        component: lazy(() => import('../Pages/ERunning'))
    },
    {
        id: 5,
        path: "/v2/exam/finish",
        exact: true,
        component: lazy(() => import('../Pages/EFinish'))
    }
]


export const routerM: IRouter[] = [
    {
        id: 0,
        path: "/v2/manage/user",
        title_i18n: "user",
        exact: false,
        icon: <UserOutlined/>,
        component: lazy(() => import('../Pages/MUser'))
    },
    {
        id: 1,
        path: "/v2/manage/problem",
        title_i18n: "problem",
        exact: false,
        icon: <FolderOutlined/>,
        component: lazy(() => import('../Pages/MProblem'))
    },
    {
        id: 2,
        path: "/v2/manage/contest",
        title_i18n: "contest",
        exact: false,
        icon: <AppstoreOutlined/>,
        component: lazy(() => import('../Pages/MContest'))
    },
    {
        id: 3,
        path: "/v2/manage/template",
        title_i18n: "template",
        exact: false,
        icon: <FileOutlined/>,
        component: lazy(() => import('../Pages/MJudgeTemplate'))
    },
    {
        id: 4,
        path: "/v2/manage/group",
        title_i18n: "group",
        exact: false,
        icon: <UsergroupAddOutlined/>,
        component: lazy(() => import('../Pages/MGroup'))
    },
    {
        id: 5,
        path: "/v2/manage/exam",
        title_i18n: "exam",
        exact: true,
        icon: <ReadOutlined/>,
        component: lazy(() => import('../Pages/MExam'))
    },
    {
        id: 6,
        path: "/v2/manage/objective",
        title_i18n: "objective",
        exact: true,
        icon: <CheckCircleOutlined/>,
        component: lazy(() => import('../Pages/MObjective'))
    },
    {
        id: 7,
        path: "/v2/manage/announcement",
        title_i18n: "Announcement",
        exact: true,
        icon: <NotificationOutlined />,
        component: lazy(() => import('../Pages/MAnnouncement'))
    }
]

export function getRouterPath(router: any[], id: number) {
    for (const x of router) {
        if (x.id === id) return x.path
    }
    return ''
}
