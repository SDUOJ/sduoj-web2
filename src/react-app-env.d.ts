/// <reference types="react-scripts" />

import axios from "axios";

declare namespace NodeJS {
    interface ProcessEnv {
        readonly NODE_ENV: 'development' | 'production',
        readonly CLIENT_OJ_SERVER: string ,
        readonly MANAGE_OJ_SERVER: string
    }
}

declare module 'axios' {
    export interface CustomSuccessData<T = any> {
        headers?: any;
        code: number,
        message: string,
        timestamp?: string,
        data?: T,
    }
}


