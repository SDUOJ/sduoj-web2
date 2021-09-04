import React, {Component} from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import MLayout from "./Component/common/MLayout";
import {Card, ConfigProvider} from "antd";
import Editor from "./Component/common/Editor";
import "vditor/src/assets/scss/index.scss";
import TestCase from "./Component/submission/TestCase";
import Processing from "./Component/submission/Processing";

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
    /*
    * TODO  用户
    *  1. 把 List 与 头部 抽象出去
    *  2. 把 Form 单独存放
    *  3. 实现 上传
    *  4. 实现 添加
    *  5. 处理 编辑内修密码与信息的逻辑
    * */

    /*
    * TODO  题目
    *  1.
    * */

    render() {
        return (
            <ConfigProvider locale={this.state.local}>
                {/*<Editor/>*/}
                {/*<MLayout id={0} roles={[0]} changeLang={this.changeLang}/>*/}
                {/*<TestCase/>*/}
                <Card title="评测信息" extra={<a href="#">More</a>} style={{ width: 700 }}>
                    <Processing TestCaseNumber={10}/>
                </Card>
            </ConfigProvider>
        );
    }

}

export default App;
