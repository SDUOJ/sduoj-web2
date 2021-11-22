import React, {Component} from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import {Card, ConfigProvider, Space, Tooltip} from "antd";
import "vditor/src/assets/scss/index.scss";
import TestCase, {TestCaseStates} from "./Component/submission/TestCase";
import Processing from "./Component/submission/Processing";
import Editor from "./Component/common/Editor";
import MLayout from "./Component/common/MLayout";
import ChangeLang from "./Component/common/ChangeLang";
import DataBaseAnswerSheet from "./Component/answerSheet/dataBase";
import ListTemplate, {colType} from "./Component/common/MTable";
import {Role, Sex} from "./Type/Iuser";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import EWait from "./Pages/EWait";
import {MultipleChoice} from "./Component/answerSheet/MultipleChoice";
import ProTag from "./Component/exam/ProTag";
import ExamAnswerSheet from "./Component/exam/ExamAnswerSheet";
import Problem from "./Component/problem/Problem";
import Options from "./Component/problem/Options";
import Choice from "./Component/problem/Choice";
import ExamPageCtrl from "./Component/exam/ExamPageCtrl";
import ExamRun from "./Component/exam/ExamRun";

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
                {/*<EWait examStartTime={Date.now() + 1000 * 10} userInfo={{"name":"尹浩飞", "studentID":"201805130160", "IDNumber":"370902200006070918"}}/>*/}
                {/*<ExamAnswerSheet/>*/}
                {/*<Problem proType={"SingleChoice"} score={10} index={3} flag={true} isFlag={false}*/}
                {/*         markdown={"## A 合并数字\n"}*/}
                {/*/>*/}

                <ExamRun/>


                {/*<Editor/>*/}
                {/*<MLayout id={0} roles={[0]} changeLang={this.changeLang}/>*/}
                {/*<ChangeLang changeLang={this.changeLang}/>*/}
                {/*<Card title="评测信息" style={{width: 900}}>*/}
                {/*    <Processing TestCaseNumber={12} TimeLimit={2000} MemoryLimit={128 * 1024} TestCaseScore={[0, 0, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]}/>*/}
                {/*</Card>*/}
                {/*<MultipleChoice/>*/}
                {/*<DataBaseAnswerSheet/>*/}


            </ConfigProvider>
        );
    }

}

export default App;
