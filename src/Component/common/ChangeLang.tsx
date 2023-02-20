import React, {Component, Dispatch} from "react";
import {Select, Space} from "antd";
import lang from "Assert/img/language.png"
import i18n from "i18next";
import {language, languageMap} from "../../Config/i18n";
import {connect} from "react-redux";
import {ConfigState} from "../../Type/IConfig";
import {ConfigAction} from "../../Redux/Action/config";
import {Locale} from "antd/lib/locale-provider";
import moment from 'moment';
import {initLanguage} from "../../Utils/initLanguage";


const {Option} = Select;

class ChangeLang extends Component<any, any> {
    defLang: string = initLanguage()

    constructor(props: any) {
        super(props);
        i18n.languages.map((value): void => {
            if (language.filter((v) => {
                return v.id === value
            }).length !== 0) {
                if (this.defLang.length === 0) this.defLang = value
            }
            return undefined
        })
        this.changeLang = this.changeLang.bind(this)
        this.changeLang(this.defLang)
    }

    changeLang(value: string) {
        i18n.changeLanguage(value)
        const id = language.findIndex((item) => {
            return item.id === value
        })
        this.props.ChangeLanguage(languageMap[value], language[id].code)
        moment.locale(language[id].code);
        localStorage.setItem('language', language[id].code)
    }

    render() {
        return (
            <>
                <Space>
                    <img src={lang} alt={'lang'} width={20}/>
                    <Select onChange={this.changeLang} defaultValue={this.defLang} bordered={false}
                            style={{marginLeft: -15}}>
                        {
                            language.map((r, i) => {
                                return (
                                    <Option key={i.toString()} value={r.id}>{r.name}</Option>
                                )
                            })
                        }
                    </Select>
                </Space>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ConfigState = state.ConfigReducer
    return {
        lang: State.lang
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ConfigAction>) => ({
    ChangeLanguage: (lang: Locale, langCode: string) => dispatch({
        type: "updateLanguage",
        lang: lang,
        langCode: langCode
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ChangeLang)
