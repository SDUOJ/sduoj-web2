import React, {Component, Suspense} from "react";
import {Layout} from "antd";
import logo from "../../Assert/img/logo.png";
import MMenu from "./MMenu";
import MHeader from "./MHeader";
import Loading from "../../Utils/Loading";
import {routerM} from "../../Config/router";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {IUserPropRoles} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";

const {Footer, Sider, Content} = Layout;

interface IMLayout extends IUserPropRoles {
    changeLang: any
}

class MLayout extends Component<IMLayout, any> {

    render() {
        return (
            <>
                <Router>
                    <Layout style={{height: "max-content", minHeight: "100%"}}>
                        <Sider theme="dark" breakpoint="lg" collapsedWidth="0">
                            <div className="logo">
                                <img src={logo} style={{width: "125px", height: '30px'}}
                                     alt={"SDUOJ-logo"}/>
                            </div>
                            <MMenu id={1} roles={[0]}/>
                        </Sider>
                        <Layout style={{minWidth: 500}}>
                            <MHeader changeLang={this.props.changeLang}/>
                            <Content style={{margin: '24px 16px 0', display: "table", height: "auto"}}>
                                <div className="site-layout-background" style={{padding: 24}}>
                                    <Suspense fallback={<Loading/>}>
                                        {/*对应路由*/}
                                        {
                                            routerM.map((r) => {
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
                            <Footer style={{textAlign: 'center'}}>SDU Online Judge System ©2020-2021</Footer>
                        </Layout>
                    </Layout>
                </Router>
            </>
        )
    }
}

export default withTranslation()(MLayout)