import {Locale} from "antd/lib/locale-provider";

// 选择合适的工作模式方便前端相关组件的复用

// 前端的工作模式
export type ModeType = "default" | "contest" | "exam"

export interface ConfigState {
    lang: Locale
    mode: ModeType
    timestamp: number
}