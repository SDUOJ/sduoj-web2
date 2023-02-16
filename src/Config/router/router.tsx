import {lazy} from "react";
import {UrlPrefix} from "../constValue";


export interface IBaseRouter {
    id: number
    path: string
    exact?: boolean
    component?: any
}

export interface IRouter extends IBaseRouter {
    title_i18n: string
    exact?: boolean
    icon?: any
    children?: IRouter[]
}

// 名称，是否为独立页面
const routerCLayoutData: any = [
    ["home", false],
    ["problem", false],
    ["contest", false],
    ["problemSet", false],
    ["problemSetPublic", false],
    ["submission", false],
    ["group", false],
    // 用户信息页面
    ["user", true],
    // 账户相关的单独页面
    ["login", true],
    ["thirdPartyLogin", true],
    ["resetpass", true],
    ["test", false],
    ["hws", false],
]
let routerCLayout: IBaseRouter[] = []
let num = 100;
for (const x of routerCLayoutData) {
    num += 1;
    routerCLayout.push({
        id: num,
        path: UrlPrefix + "/" + x[0],
        exact: x[1],
        component: lazy(() => import("../../Component/layout/CLayout"))
    })
}


export const routerLayout: IBaseRouter[] = [
    // Layout 大块
    {
        id: 0,
        path: UrlPrefix + "/manage",
        exact: false,
        component: lazy(() => import('../../Component/layout/MLayout'))
    },
    {
        id: 1,
        path: UrlPrefix + "/exam",
        exact: false,
        component: lazy(() => import('../../Component/layout/ELayout'))
    },
    {
        id: 4,
        path: UrlPrefix,
        exact: true,
        component: lazy(() => import('../../Component/layout/CLayout'))
    },
    ...routerCLayout,
    {
        id: 14,
        path: UrlPrefix + "/error/time",
        exact: true,
        component: lazy(() => import('../../Pages/Error/TimeError'))
    },
    {
        id: 15,
        path: UrlPrefix + "/error/browser",
        exact: true,
        component: lazy(() => import('../../Pages/Error/BrowserVersionError'))
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
]


export function getRouterPath(router: any[], id: number) {
    for (const x of router) {
        if (x.id === id) return x.path
    }
    return ''
}
