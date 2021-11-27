import LanguageDetector from 'i18next-browser-languagedetector';
import i18n from "i18next";
import {initReactI18next} from 'react-i18next';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import {Locale} from "antd/lib/locale-provider";

import 'moment/locale/zh-cn';
import moment from 'moment';
moment.locale('zh-cn');

interface ILanguage {
    id: string
    name: string
}

export const language: ILanguage[] = [
    {
        id: "en",
        name: "English"
    },
    {
        id: "zh",
        name: "简体中文"
    }
]

export const languageMap: {[key: string]: Locale } = {
    "zh": zhCN,
    "en": enUS
}

i18n.use(LanguageDetector) //嗅探当前浏览器语言
    .use(initReactI18next) //init i18next
    .init({
        //引入资源文件
        resources: {
            en: {
                translation: require("../Assert/lang/en.json"),
            },
            zh: {
                translation: require("../Assert/lang/zh.json"),
            }
        },
        //选择默认语言，选择内容为上述配置中的key，即en/zh
        fallbackLng: "zh",
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    })

export default i18n;