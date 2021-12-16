import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import logo from "../../Assert/img/logo.png";
import MMenu from "./MMenu";
import MHeader from "./MHeader";
import Loading from "../../Utils/Loading";
import {routerM} from "../../Config/router";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {IUserPropRoles} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {ManageState} from "../../Type/IManage";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import FooterSDU from "./FooterSDU";
import {testLoginTodo} from "../../Redux/Action/user";

const {Sider, Content} = Layout;

class MLayout extends Component<any, any> {

    componentDidMount() {
        if ((
            this.props.location.pathname === '/v2/manage'
            || this.props.location.pathname === '/v2/manage/'
        ) && routerM.length !== 0) {
            this.props.history.push(routerM[0].path);
        }
        this.props.testLogin()
    }

    render() {
        return (
            <>
                <Layout style={{height: "max-content", minHeight: "100%"}}>
                    <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
                        <div className="logo">
                            <img src={logo} style={{width: "125px", height: '30px'}}
                                 alt={"SDUOJ-logo"}/>
                        </div>
                        <MMenu id={1} roles={["superadmin"]}/>
                    </Sider>
                    <Layout style={{minWidth: 500}}>
                        <MHeader/>
                        <Content style={{margin: '24px 16px 0', display: "table", height: "auto"}}>
                            <div className="site-layout-background" style={{padding: 24}}>
                                <Suspense fallback={<Loading/>}>
                                    {/*对应路由*/}
                                    {
                                        routerM.map((r) => {
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
    const State: ManageState = state.ManageReducer
    return {

    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(MLayout)
))