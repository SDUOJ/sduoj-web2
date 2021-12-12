import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import Loading from "../../Utils/Loading";
import {routerC} from "../../Config/router";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import FooterSDU from "./FooterSDU";

const {Footer, Sider, Content} = Layout;

class MLayout extends Component<any, any> {

    componentDidMount() {
        if ((
            this.props.location.pathname === ''
            || this.props.location.pathname === '/'
        ) && routerC.length !== 0) {
            // sessionStorage.setItem("returnPath", "/") // TODO
            this.props.history.push(routerC[0].path);
        }
    }

    render() {
        return (
            <>
                <Router>
                    <Layout style={{height: "max-content", minHeight: "100%"}}>
                        <Layout style={{minWidth: 500}}>
                            <Content style={{margin: '24px 16px 0', display: "table", height: "auto"}}>
                                <div className="site-layout-background" style={{padding: 24}}>
                                    <Suspense fallback={<Loading/>}>
                                        {/*对应路由*/}
                                        {
                                            routerC.map((r) => {
                                                const Page = r.component;
                                                return (
                                                    <Route key={r.id} path={r.path} exact={r.exact}
                                                           component={() => <Page id={this.props.id}
                                                                                  roles={this.props.roles}/>}/>
                                                )
                                            })
                                        }
                                    </Suspense>
                                </div>
                            </Content>
                            <FooterSDU/>
                        </Layout>
                    </Layout>
                </Router>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(MLayout)))