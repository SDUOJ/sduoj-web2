import React, {Component, Suspense} from "react";
import {Layout} from "antd";
import logo from "../../Assert/img/logo.png";
import MMenu from "./MMenu";
import MHeader from "./MHeader";
import Loading from "../../Utils/Loading";
import {Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {routerM} from "../../Config/router/routerM";
import {UrlPrefix} from "../../Config/constValue";
import {IRouter} from "../../Config/router/router";
import LoginCheck from "../common/LoginCheck";

const {Sider, Content} = Layout;

class MLayout extends Component<any, any> {

    componentDidMount() {
        if ((
            this.props.location.pathname === UrlPrefix + '/manage'
            || this.props.location.pathname === UrlPrefix + '/manage/'
        ) && routerM.length !== 0) {
            this.props.history.push(routerM[0].path);
        }
    }

    render() {
        const geneRoute: any = (router: IRouter[]) => {
            return router.map((r) => {
                if (r.children !== undefined) return geneRoute(r.children)
                else {
                    return (
                        <Route key={r.id} path={r.path} exact={r.exact}
                               component={r.component}/>
                    )
                }
            })
        }
        return (
            <>
                <LoginCheck jump={true}/>
                <Layout style={{height: "max-content", minHeight: "100%"}}>
                    <Sider theme="dark" style={{position: 'fixed', zIndex: 50, height: '100vh', overflow: "auto"}}>
                        <div className="logo">
                            <img src={logo} style={{width: "125px", height: '30px'}}
                                 alt={"SDUOJ-logo"}/>
                        </div>
                        <MMenu id={1} roles={["superadmin"]}/>
                    </Sider>
                    <Layout style={{minWidth: 1200, marginLeft: 200}}>
                        <MHeader/>
                        <Content style={{
                            backgroundColor: "#ffffff",
                            paddingTop: 64,
                            margin: '20px 16px 0',
                            display: "table",
                            height: "auto"
                        }}>
                            <div className="site-layout-background" style={{padding: 24}}>
                                <Suspense fallback={<Loading/>}>
                                    {/*对应路由*/}
                                    {geneRoute(routerM)}
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


export default withTranslation()(
    withRouter(MLayout)
)
