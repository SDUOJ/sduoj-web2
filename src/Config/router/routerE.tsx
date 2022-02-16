import {lazy} from "react";
import {IBaseRouter} from "./router";

export const routerE: IBaseRouter[] = [
    {
        id: 2,
        path: "/v2/exam/list",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EList'))
    },
    {
        id: 3,
        path: "/v2/exam/wait/:eid",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EWait'))
    },
    {
        id: 4,
        path: "/v2/exam/running/:eid/:gid/:pid",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/ERunning'))
    },
    {
        id: 5,
        path: "/v2/exam/finish",
        exact: true,
        component: lazy(() => import('../../Pages/Exam/EFinish'))
    }
]