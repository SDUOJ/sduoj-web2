import React, {Component} from "react";
import {Select, Space} from "antd";
import lang from "Assert/img/language.png"
import i18n from "i18next";
import {language, languageMap} from "../../Config/i18n";

import moment from 'moment';
import 'moment/locale/zh-cn';

const {Option} = Select;

export default class ChangeLang extends Component<any, any> {
    changeLang(value: string) {
        i18n.changeLanguage(value)
        moment.locale(value);
        this.props.changeLang(languageMap[value])
    }
    defLang: string = ""

    constructor(props: any) {
        super(props);
        i18n.languages.map((value):void=>{
            if(language.filter((v)=>{return v.id === value}).length !== 0){
                if(this.defLang.length === 0) this.defLang = value
            }
        })
        this.changeLang = this.changeLang.bind(this)
        this.changeLang(this.defLang)
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