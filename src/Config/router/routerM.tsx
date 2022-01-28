import {
    AppstoreOutlined,
    CheckCircleOutlined,
    FileOutlined,
    FolderOutlined,
    NotificationOutlined,
    ReadOutlined,
    UsergroupAddOutlined,
    UserOutlined
} from "@ant-design/icons";
import {lazy} from "react";
import {IRouter} from "./router";

export const routerM: IRouter[] = [
    {
        id: 0,
        path: "/v2/manage/user",
        title_i18n: "user",
        exact: false,
        icon: <UserOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MUser'))
    },
    {
        id: 1,
        path: "/v2/manage/problem",
        title_i18n: "problem",
        exact: false,
        icon: <FolderOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MProblem'))
    },
    {
        id: 2,
        path: "/v2/manage/contest",
        title_i18n: "contest",
        exact: false,
        icon: <AppstoreOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MContest'))
    },
    {
        id: 3,
        path: "/v2/manage/template",
        title_i18n: "template",
        exact: false,
        icon: <FileOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MJudgeTemplate'))
    },
    {
        id: 4,
        path: "/v2/manage/group",
        title_i18n: "group",
        exact: false,
        icon: <UsergroupAddOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MGroup'))
    },
    {
        id: 5,
        path: "/v2/manage/exam",
        title_i18n: "exam",
        exact: true,
        icon: <ReadOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MExam'))
    },
    {
        id: 6,
        path: "/v2/manage/objective",
        title_i18n: "objective",
        exact: true,
        icon: <CheckCircleOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MObjective'))
    },
    {
        id: 7,
        path: "/v2/manage/announcement",
        title_i18n: "Announcement",
        exact: true,
        icon: <NotificationOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MAnnouncement'))
    }
]