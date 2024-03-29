import i18n from "i18next";
import {initReactI18next} from 'react-i18next';
import enUS from 'antd/lib/locale/en_US';
import zhCN from 'antd/lib/locale/zh_CN';
import {Locale} from "antd/lib/locale-provider";
import {initLanguage} from "../Utils/initLanguage";
import moment from "moment/moment";

interface ILanguage {
    id: string
    name: string
    code: string,
    time: string
}

export const language: ILanguage[] = [
    {
        id: "en",
        name: "English",
        code: "en_US",
        time: "en"
    },
    {
        id: "zh",
        name: "简体中文",
        code: "zh_CN",
        time: "zh-cn"
    }
]

export const languageMap: { [key: string]: Locale } = {
    "zh": zhCN,
    "en": enUS
}

const defLang = initLanguage();
const id_ = language.findIndex((item) => {
    return item.id === defLang
})
moment.locale(language[id_].time);

i18n.use(initReactI18next) //init i18next
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
        lng: defLang,
        debug: false,
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    })

export default i18n;
