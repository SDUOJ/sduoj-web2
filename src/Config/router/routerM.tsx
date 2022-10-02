import Icon, {
    AppstoreOutlined,
    CheckCircleOutlined,
    FileOutlined,
    FolderOutlined,
    NotificationOutlined,
    ReadOutlined,
    UsergroupAddOutlined,
    UserOutlined
} from "@ant-design/icons";

import {ReactComponent as Compare} from "Assert/img/compare.svg"
import {ReactComponent as Hub} from "Assert/img/hub.svg"
import {ReactComponent as Task} from "Assert/img/task.svg"
import {ReactComponent as Core} from "Assert/img/core.svg"

import {lazy} from "react";
import {IRouter} from "./router";
import {UrlPrefix} from "../constValue";

export const routerM: IRouter[] = [
    {
        id: 0,
        path: UrlPrefix + "/manage/user",
        title_i18n: "user",
        exact: false,
        icon: <UserOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MUser'))
    },
    {
        id: 1,
        path: UrlPrefix + "/manage/problem",
        title_i18n: "problem",
        exact: false,
        icon: <FolderOutlined/>,
        children:[
            {
                id: 11,
                path: UrlPrefix + "/manage/problem/program",
                exact: true,
                title_i18n: "编程题",
                icon:  <Icon component={Hub}/>,
                component: lazy(() => import('../../Pages/Manage/Problem/MProblem'))
            },
            {
                id: 12,
                path: UrlPrefix + "/manage/problem/objective",
                exact: true,
                title_i18n: "客观题",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/Problem/MObjective'))
            },
            {
                id: 13,
                path: UrlPrefix + "/manage/problem/subjective",
                exact: true,
                title_i18n: "主观题",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/Problem/MObjective'))
            },
            {
                id: 14,
                path: UrlPrefix + "/manage/problem/review",
                exact: true,
                title_i18n: "题目批阅",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/Problem/MReview'))
            },
        ]
    },
    {
        id: 2,
        path: UrlPrefix + "/manage/problemSet",
        title_i18n: "problemSet",
        exact: false,
        icon: <AppstoreOutlined/>,
        children:[
            {
                id: 21,
                path: UrlPrefix + "/manage/problemSet/contest",
                exact: true,
                title_i18n: "contest",
                icon:  <Icon component={Hub}/>,
                component: lazy(() => import('../../Pages/Manage/MContest'))
            },
            {
                id: 22,
                path: UrlPrefix + "/manage/problemSet/default",
                exact: true,
                title_i18n: "defaultProblemSet",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/MJudgeTemplate'))
            },
            {
                id: 23,
                path: UrlPrefix + "/manage/problemSet/exam",
                exact: true,
                title_i18n: "exam",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/MExam'))
            },
        ]

    },
    {
        id: 3,
        path: UrlPrefix + "/manage/template",
        title_i18n: "template",
        exact: false,
        icon: <FileOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MJudgeTemplate')),
        children:[
            {
                id: 31,
                path: UrlPrefix + "/manage/template/io",
                exact: true,
                title_i18n: "ioTemplate",
                icon:  <Icon component={Hub}/>,
                component: lazy(() => import('../../Pages/Manage/MJudgeTemplate'))
            },
            {
                id: 32,
                path: UrlPrefix + "/manage/template/advanced",
                exact: true,
                title_i18n: "advancedTemplate",
                icon:  <Icon component={Task}/>,
                component: lazy(() => import('../../Pages/Manage/MJudgeTemplate'))
            },
        ]
    },
    {
        id: 4,
        path: UrlPrefix + "/manage/group",
        title_i18n: "group",
        exact: false,
        icon: <UsergroupAddOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MGroup'))
    },
    // {
    //     id: 5,
    //     path: UrlPrefix + "/manage/exam",
    //     title_i18n: "exam",
    //     exact: true,
    //     icon: <ReadOutlined/>,
    //     component: lazy(() => import('../../Pages/Manage/MExam'))
    // },
    {
        id: 7,
        path: UrlPrefix + "/manage/announcement",
        title_i18n: "Announcement",
        exact: true,
        icon: <NotificationOutlined/>,
        component: lazy(() => import('../../Pages/Manage/MAnnouncement'))
    },
    // {
    //     id: 8,
    //     title_i18n: "codeAntiCheating",
    //     path: UrlPrefix + "/manage/anti-cheating/",
    //     icon:  <Icon component={Compare}/>,
    //     exact: false,
    //     children:[
    //         {
    //             id: 81,
    //             path: UrlPrefix + "/manage/anti-cheating/hub",
    //             exact: true,
    //             title_i18n: "codeRepository",
    //             icon:  <Icon component={Hub}/>,
    //             component: lazy(() => import('../../Pages/Manage/AntiCheating/Hub'))
    //         },
    //         {
    //             id: 82,
    //             path: UrlPrefix + "/manage/anti-cheating/task",
    //             exact: true,
    //             title_i18n: "codeAntiCheatingTask",
    //             icon:  <Icon component={Task}/>,
    //             component: lazy(() => import('../../Pages/Manage/AntiCheating/Task'))
    //         },
    //         {
    //             id: 83,
    //             path: UrlPrefix + "/manage/anti-cheating/core",
    //             exact: true,
    //             title_i18n: "codeAntiCheatingCore",
    //             icon:  <Icon component={Core}/>,
    //             component: lazy(() => import('../../Pages/Manage/AntiCheating/Core'))
    //         },
    //     ]
    // }
]