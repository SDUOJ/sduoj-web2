import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import Loading from "../../Utils/Loading";
import {Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import FooterSDU from "./FooterSDU";
import CHeader from "./CHeader";
import {testLoginTodo} from "../../Redux/Action/user";
import {routerC} from "../../Config/router/routerC";

const {Content} = Layout;

class MLayout extends Component<any, any> {

    componentDidMount() {
        if (this.props.location.pathname === '/v2' || this.props.location.pathname === '/v2/') {
            this.props.history.push("/v2/home");
        }
        this.props.testLogin()
    }

    render() {
        return (
            <>
                <Layout style={{height: "max-content", minHeight: "100%", minWidth: "1000px"}}>
                    <Layout style={{minWidth: 500}}>
                        <CHeader/>
                        <Content style={{backgroundColor: "#f0f2f5", paddingTop: 64, margin: '20px 16px 0', display: "table", height: "auto"}}>
                            <div style={{padding: 18}}>
                                <Suspense fallback={<Loading/>}>
                                    {/*对应路由*/}
                                    {
                                        routerC.map((r) => {
                                            return (
                                                <Route key={r.id} path={r.path} exact={r.exact}
                                                       component={r.component}/>
                                            )
                                        })
                                    }
                                </Suspense>
                            </div>
                        </Content>
                        <FooterSDU/>
                    </Layout>
                </Layout>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(MLayout)))