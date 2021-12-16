import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import logo from "../../Assert/img/logo.png";
import Loading from "../../Utils/Loading";
import {getRouterPath, routerE, routerLayout, routerM} from "../../Config/router";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import EHeader from "./EHeader";
import {ExamState, IUserExamInfo} from "../../Type/IExam";
import {ConfigState} from "../../Type/IConfig";
import {UserState} from "../../Type/Iuser";
import {examID} from "../../Type/types";

import {connect} from "react-redux";
import {withRouter} from "react-router";
import {getCopyRightTodo} from "../../Redux/Action/config";
import {testLoginTodo} from "../../Redux/Action/user";
import FooterSDU from "./FooterSDU";

const {Footer, Content} = Layout;

class ELayout extends Component<any, any> {

    componentDidMount() {
        if ((
            this.props.location.pathname === '/v2/exam' ||
            this.props.location.pathname === '/v2/exam/'
        ) && routerE.length !== 0) {
            // sessionStorage.setItem("returnPath", getRouterPath(routerE, 2))
            this.props.history.push(getRouterPath(routerE, 2));
            // window.location.reload();
        }
        this.props.testLogin()
    }

    render() {
        return (
            <>
                <Layout style={{height: "max-content", minHeight: "100%"}}>
                    <Layout style={{minWidth: 500}}>
                        <EHeader/>
                        <Content style={{margin: '24px 16px 0', display: "table", height: "auto"}}>
                            <div className="site-layout-background" style={{padding: 24}}>
                                <Suspense fallback={<Loading/>}>
                                    {/*对应路由*/}
                                    {
                                        routerE.map((r) => {
                                            return (
                                                <Route key={r.id} path={r.path} exact={r.exact}
                                                       component={r.component}/>
                                            )
                                        })
                                    }
                                </Suspense>
                            </div>
                        </Content>
                        {/*<FooterSDU/>*/}
                    </Layout>
                </Layout>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const CState: ConfigState = state.ConfigReducer
    // console.log("ELayout", CState.copyRight)
    return {
        copyRight: CState.copyRight
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ELayout)
    ))
