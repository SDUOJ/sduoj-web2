import {lazy} from "react";
import {UrlPrefix} from "../constValue";


export interface IBaseRouter {
    id: number
    path: string
    exact?: boolean
    component: any
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
    ["submission", false],
    ["group", false],
    // 用户信息页面
    ["user", true],
    // 账户相关的单独页面
    ["login", true],
    ["thirdPartyLogin", true],
    ["resetpass", true],
    ["test", false],
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
        path: "/v2/manage",
        exact: false,
        component: lazy(() => import('../../Component/layout/MLayout'))
    },
    {
        id: 1,
        path: "/v2/exam",
        exact: false,
        component: lazy(() => import('../../Component/layout/ELayout'))
    },
    {
        id: 4,
        path: "/v2",
        exact: true,
        component: lazy(() => import('../../Component/layout/CLayout'))
    },
    ...routerCLayout,
    {
        id: 14,
        path: "/v2/error/time",
        exact: true,
        component: lazy(() => import('../../Pages/Error/TimeError'))
    },
]


export function getRouterPath(router: any[], id: number) {
    for (const x of router) {
        if (x.id === id) return x.path
    }
    return ''
}
