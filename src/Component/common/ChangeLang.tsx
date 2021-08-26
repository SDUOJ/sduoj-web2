import React, {Component} from "react";
import {Select, Space} from "antd";
import lang from "Assert/img/language.png"
import i18n from "i18next";
import {language} from "../../Config/i18n";

const {Option} = Select;

export default class ChangeLang extends Component<any, any> {
    changeLang(value: string) {
        i18n.changeLanguage(value)
    }

    render() {
        console.log(i18n.languages)
        return (
            <>
                <Space>
                    <img src={lang} alt={'lang'} width={20}/>
                    <Select onChange={this.changeLang} defaultValue={i18n.language} bordered={false}
                            style={{marginLeft: -15}}>
                        {
                            language.map((r, i) => {
                                return (
                                    <Option value={r.id}>{r.name}</Option>
                                )
                            })
                        }
                    </Select>
                </Space>
            </>
        )
    }
}