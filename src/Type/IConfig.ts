import { Locale } from 'antd/es/locale';

// 选择合适的工作模式方便前端相关组件的复用

// 前端的工作模式
export type ModeType = "default" | "contest" | "exam"

export interface ConfigState {
    lang: Locale
    langCode: string
    mode: ModeType
    timestamp: number
    copyRight: string
}