import {lazy} from "react";
import {IBaseRouter} from "./router";
import {UrlPrefix} from "../constValue";

export const routerE: IBaseRouter[] = [
    {
        id: 2,
        path: UrlPrefix + "/exam/list",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EList'))
    },
    {
        id: 3,
        path: UrlPrefix + "/exam/wait/:eid",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EWait'))
    },
    {
        id: 4,
        path: UrlPrefix + "/exam/running/:eid/:gid/:pid",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/ERunning'))
    },
    {
        id: 5,
        path: UrlPrefix + "/exam/finish",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EFinish'))
    },
    {
        id: 6,
        path: UrlPrefix + "/exam/report/:eid",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EReport'))
    },
]