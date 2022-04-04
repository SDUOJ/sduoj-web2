import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import Loading from "../../Utils/Loading";
import {getRouterPath} from "../../Config/router/router";
import {Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import EHeader from "./EHeader";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {testLoginTodo} from "../../Redux/Action/user";
import {routerE} from "../../Config/router/routerE";
import {UrlPrefix} from "../../Config/constValue";


const {Footer, Content} = Layout;

class ELayout extends Component<any, any> {

    componentDidMount() {
        if ((
            this.props.location.pathname === UrlPrefix + '/exam' ||
            this.props.location.pathname === UrlPrefix + '/exam/'
        ) && routerE.length !== 0) {
            this.props.history.push(getRouterPath(routerE, 2));
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
                        <Footer style={{textAlign: 'center'}}>
                            若遇到限流问题，请稍后刷新页面即可。 考试结束后，试卷会自动提交。 若主动交卷，则试卷将被锁定，无法再次改动。
                        </Footer>
                        {/*<FooterSDU/>*/}
                    </Layout>
                </Layout>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
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
