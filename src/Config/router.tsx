import {lazy} from "react";
import {
    AppstoreOutlined,
    CheckCircleOutlined,
    FileOutlined,
    FolderOutlined,
    UsergroupAddOutlined,
    UserOutlined,
    ReadOutlined
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
        path: "/manage",
        exact: false,
        component: lazy(() => import('../Component/layout/MLayout'))
    },
    {
        id: 1,
        path: "/exam",
        exact: false,
        component: lazy(() => import('../Component/layout/ELayout'))
    },
    {
        id: 2,
        path: "/thirdPartyLogin",
        exact: false,
        component: lazy(() => import('../Pages/thirdPartyLogin'))
    },
    {
        id: 3,
        path: "/c",
        exact: false,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
    {
        id: 4,
        path: "/",
        exact: true,
        component: lazy(() => import('../Component/layout/CLayout'))
    },
]


export const routerC: IBaseRouter[] = [
    {
        id: 1,
        path: "/c/login",
        exact: true,
        component: lazy(() => import('../Pages/ALogin'))
    }
]


export const routerE: IBaseRouter[] = [
    {
        id: 1,
        path: "/exam/login",
        exact: true,
        component: lazy(() => import('../Pages/ALogin'))
    },
    {
        id: 2,
        path: "/exam/list",
        exact: true,
        component: lazy(() => import('../Pages/EList'))
    },
    {
        id: 3,
        path: "/exam/wait/:eid",
        exact: true,
        component: lazy(() => import('../Pages/EWait'))
    },
    {
        id: 4,
        path: "/exam/running/:eid",
        exact: true,
        component: lazy(() => import('../Pages/ERunning'))
    },
    {
        id: 5,
        path: "/exam/finish",
        exact: true,
        component: lazy(() => import('../Pages/EFinish'))
    }
]


export const routerM: IRouter[] = [
    // {
    //     id: 0,
    //     path: "/manage/user",
    //     title_i18n: "user",
    //     exact: false,
    //     icon: <UserOutlined/>,
    //     component: lazy(() => import('../Pages/MUser'))
    // },
    // {
    //     id: 1,
    //     path: "/manage/problem",
    //     title_i18n: "problem",
    //     exact: false,
    //     icon: <FolderOutlined/>,
    //     component: lazy(() => import('../Pages/MProblem'))
    // },
    // {
    //     id: 2,
    //     path: "/manage/contest",
    //     title_i18n: "contest",
    //     exact: false,
    //     icon: <AppstoreOutlined/>,
    //     component: lazy(() => import('../Pages/MContest'))
    // },
    // {
    //     id: 3,
    //     path: "/manage/template",
    //     title_i18n: "template",
    //     exact: false,
    //     icon: <FileOutlined/>,
    //     component: lazy(() => import('../Pages/MJudgeTemplate'))
    // },
    // {
    //     id: 4,
    //     path: "/manage/group",
    //     title_i18n: "group",
    //     exact: false,
    //     icon: <UsergroupAddOutlined/>,
    //     component: lazy(() => import('../Pages/MGroup'))
    // },
    {
        id: 5,
        path: "/manage/exam",
        title_i18n: "exam",
        exact: false,
        icon: <ReadOutlined/>,
        component: lazy(() => import('../Pages/MExam'))
    },
    {
        id: 6,
        path: "/manage/objective",
        title_i18n: "objective",
        exact: false,
        icon: <CheckCircleOutlined/>,
        component: lazy(() => import('../Pages/MObjective'))
    }
]

export function getRouterPath(router: any[], id: number) {
    for (const x of router){
        if(x.id === id) return x.path
    }
    return ''
}
