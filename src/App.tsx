import React, {Component} from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import MLayout from "./Component/common/MLayout";
import {ConfigProvider} from "antd";
import Editor from "./Component/common/Editor";
import "vditor/src/assets/scss/index.scss";

class App extends Component<any, any> {


    constructor(props: any) {
        super(props);
        this.state = {
            local: "en"
        }
        this.changeLang = this.changeLang.bind(this)
    }

    changeLang(value: string) {
        this.setState({local: value})
    }

    render() {
        return (
            <ConfigProvider locale={this.state.local}>
                <Editor/>
                <MLayout id={0} roles={[0]} changeLang={this.changeLang}/>
            </ConfigProvider>
        );
    }

}

export default App;
