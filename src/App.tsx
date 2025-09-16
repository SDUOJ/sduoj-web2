import React, {Dispatch, Suspense, lazy} from 'react';

import './App.css';

import './Config/i18n'
import {ConfigProvider} from "antd";
import {appTheme} from './Config/theme';
import {connect} from "react-redux";
import {ConfigState} from "./Type/IConfig";
import {BrowserRouter as Router, Route} from "react-router-dom";
import Loading from "./Utils/Loading";
import {routerLayout} from "./Config/router/router";
const SubmissionModal = lazy(() => import('./Component/submission/Processing/ModalProcessing'));
const RequirePassChange = lazy(() => import('./Component/common/RequirePassChange'));


const App = (props: any) => {


    return (
        // antd 全局化配置  国际化参数
    <ConfigProvider locale={props.local} theme={appTheme}>
            {/*顶级路由*/}
            <Router>
                {/* 提交详情窗体 / 密码修改提示 懒加载，避免首屏引入 */}
                <Suspense fallback={null}>
                    <SubmissionModal/>
                    <RequirePassChange/>
                </Suspense>
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
