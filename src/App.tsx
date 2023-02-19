import React, {Component, Dispatch, Suspense} from 'react';

import './App.css';
import 'antd/dist/antd.css';
import './Config/i18n'
import {ConfigProvider} from "antd";
import "vditor/src/assets/less/index.less";
import {connect} from "react-redux";
import {ConfigState} from "./Type/IConfig";
import {BrowserRouter as Router, Route} from "react-router-dom";
import Loading from "./Utils/Loading";
import {routerLayout} from "./Config/router/router";
import SubmissionModal from "./Component/submission/Processing/ModalProcessing";


const App = (props: any) => {


    return (
        // antd 全局化配置  国际化参数
        <ConfigProvider locale={props.local}>
            {/*顶级路由*/}
            <Router>
                {/*提交详情窗体*/}
                <SubmissionModal/>
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

const mapStateToProps = (state: any) => {
    const State: ConfigState = state.ConfigReducer
    return {
        local: State.lang,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App)
