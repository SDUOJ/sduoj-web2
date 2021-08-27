import {
    AxiosResponse, AxiosRequestConfig, CustomSuccessData
} from "axios";

export interface Get {
    <T>(url: string, params?: object, config?: AxiosRequestConfig): Promise<CustomSuccessData<T>>;
}

export interface Post {
    <T>(url: string, data: object, config?: AxiosRequestConfig): Promise<CustomSuccessData<T>>
}

export interface GetError {
    (url: string, data?: object, config?: AxiosRequestConfig): void
}
