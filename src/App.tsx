import React, {Component, Dispatch, Suspense} from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import {Card, ConfigProvider, Space, Tooltip} from "antd";
import "vditor/src/assets/scss/index.scss";
import {Role, Sex, thirdPartyLoginAction} from "./Type/Iuser";
import {connect} from "react-redux";
import {ConfigState} from "./Type/IConfig";
import {BrowserRouter as Router, Route} from "react-router-dom";
import Loading from "./Utils/Loading";
import {routerLayout, routerM} from "./Config/router";
import cookie from "react-cookies";
import {testLoginTodo, thirdPartyLoginTodo} from "./Redux/Action/user";
import '@ant-design/pro-form/dist/form.css';
import '@ant-design/pro-table/dist/table.css';
import '@ant-design/pro-layout/dist/layout.css';
import "@ant-design/pro-card/dist/card.css";
import "@ant-design/pro-list/dist/list.css";
import "@ant-design/pro-descriptions/dist/descriptions.css"
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


class App extends Component<any, any> {


    constructor(props: any) {
        super(props);
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

    componentDidMount() {

    }

    render() {
        return (
            // antd 全局化配置  国际化参数
            <ConfigProvider locale={this.props.local}>
                {/*顶级路由*/}
                <Router>
                    <Suspense fallback={<Loading/>}>
                        {
                            routerLayout.map((r) => {
                                return (
                                    <Route key={r.id} path={r.path} exact={r.exact}
                                           component={r.component}/>
                                )
                            })
                        }
                    </Suspense>
                </Router>
            </ConfigProvider>
        );
    }

}

{/*<EExaming/>*/
}
{/*<EWait examStartTime={Date.now() + 1000 * 10} userInfo={{"name":"尹浩飞", "studentID":"201805130160", "IDNumber":"370902200006070918"}}/>*/
}
{/*<ExamAnswerSheet/>*/
}
{/*<Problem proType={"SingleChoice"} score={10} index={3} flag={true} isFlag={false}*/
}
{/*         markdown={"## A 合并数字\n"}*/
}
{/*/>*/
}
{/*<Editor/>*/
}
{/*<MLayout id={0} roles={[0]} changeLang={this.changeLang}/>*/
}
{/*<ChangeLang changeLang={this.changeLang}/>*/
}
{/*<Card title="评测信息" style={{width: 900}}>*/
}
{/*    <Processing TestCaseNumber={12} TimeLimit={2000} MemoryLimit={128 * 1024} TestCaseScore={[0, 0, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]}/>*/
}
{/*</Card>*/
}
{/*<MultipleChoice/>*/
}
{/*<DataBaseAnswerSheet/>*/
}

const mapStateToProps = (state: any) => {
    const State: ConfigState = state.ConfigReducer
    return {
        local: State.lang,
        timestamp: State.timestamp
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    thirdPartyLogin: (data: thirdPartyLoginAction) =>
        dispatch(thirdPartyLoginTodo(data)),
    updateTimestamp: (data: number) => dispatch({
        type: "updateTimestamp",
        timestamp: data
    }),
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
