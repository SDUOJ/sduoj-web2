import React, {Component, Suspense} from "react";
import {Layout} from "antd";
import logo from "../../Assert/img/logo.png";
import Loading from "../../Utils/Loading";
import {routerE, routerLayout, routerM} from "../../Config/router";
import {BrowserRouter as Router, Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import EHeader from "./EHeader";

const {Footer, Sider, Content} = Layout;

class ELayout extends Component<any, any> {

    render() {
        return (
            <>
                <Router>
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
                            <Footer style={{textAlign: 'center'}}>SDU Online Exam System ©2020-2021</Footer>
                        </Layout>
                    </Layout>
                </Router>
            </>
        )
    }
}

export default withTranslation()(ELayout)