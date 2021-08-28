import {lazy} from "react";
import {AppstoreOutlined, FileOutlined, FolderOutlined, UsergroupAddOutlined, UserOutlined} from "@ant-design/icons"

interface IRouter {
    id: number
    path: string
    title_i18n: string
    exact?: boolean
    component: any
    icon: any
    children?: IRouter[]
}


export const routerM: IRouter[] = [
    {
        id: 0,
        path: "/manage/user",
        title_i18n: "user",
        exact: false,
        icon: <UserOutlined/>,
        component: lazy(() => import('../Pages/MUser'))
    },
    {
        id: 1,
        path: "/manage/problem",
        title_i18n: "problem",
        exact: false,
        icon: <FolderOutlined/>,
        component: lazy(() => import('../Pages/MProblem'))
    },
    {
        id: 2,
        path: "/manage/contest",
        title_i18n: "contest",
        exact: false,
        icon: <AppstoreOutlined/>,
        component: lazy(() => import('../Pages/MContest'))
    },
    {
        id: 3,
        path: "/manage/template",
        title_i18n: "template",
        exact: false,
        icon: <FileOutlined/>,
        component: lazy(() => import('../Pages/MJudgeTemplate'))
    },
    {
        id: 4,
        path: "/manage/group",
        title_i18n: "group",
        exact: false,
        icon: <UsergroupAddOutlined/>,
        component: lazy(() => import('../Pages/MGroup'))
    },


    {
        id: 100,
        path: "/manage/test",
        title_i18n: 'test',
        exact: false,
        icon: <FileOutlined />,
        component: lazy(() => import('../Pages/TestPage'))
    }
]
