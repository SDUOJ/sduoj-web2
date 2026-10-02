import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import Loading from "../../Utils/Loading";
import {getRouterPath} from "../../Config/router/router";
import {Route, Switch} from "react-router-dom";
import {withTranslation} from "react-i18next";
import EHeader from "./EHeader";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {routerE} from "../../Config/router/routerE";
import {UrlPrefix} from "../../Config/constValue";
import LoginCheck from "../common/LoginCheck";
import NotFound from '../../Pages/Error/NotFound';


const {Footer, Content} = Layout;

class ELayout extends Component<any, any> {

    redirectExamRoot() {
        if (this.props.authStatus !== 'authenticated') return;
        if ((
            this.props.location.pathname === UrlPrefix + '/exam' ||
            this.props.location.pathname === UrlPrefix + '/exam/'
        ) && routerE.length !== 0) {
            this.props.history.replace(getRouterPath(routerE, 2));
        }
    }

    componentDidMount() {
        this.redirectExamRoot();
    }

    componentDidUpdate(prevProps: Readonly<any>) {
        if (prevProps.authStatus !== this.props.authStatus || prevProps.location.pathname !== this.props.location.pathname) {
            this.redirectExamRoot();
        }
    }

    render() {
        if (this.props.authStatus !== 'authenticated') {
            return <LoginCheck jump={true}/>;
        }
        return (
            <>
                <LoginCheck jump={true}/>
                <Layout style={{height: "max-content", minHeight: "100%"}}>
                    <Layout style={{minWidth: 0, width: '100%'}}>
                        <EHeader/>
                        <Content style={{margin: '24px clamp(8px, 3vw, 16px) 0', display: "block", height: "auto", minWidth: 0}}>
                            <div className="site-layout-background" style={{padding: 'clamp(8px, 3vw, 24px)', minWidth: 0}}>
                                <Suspense fallback={<Loading/>}>
                                    {/*对应路由*/}
                                    <Switch>
                                        {routerE.map((r) => (
                                            <Route key={r.id} path={r.path} exact={r.exact}
                                                   component={r.component}/>
                                        ))}
                                        <Route component={NotFound}/>
                                    </Switch>
                                </Suspense>
                            </div>
                        </Content>
                        <Footer style={{textAlign: 'center'}}>
                            {this.props.t('ExamFooterNotice')}
                        </Footer>
                        {/*<FooterSDU/>*/}
                    </Layout>
                </Layout>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {authStatus: state.UserReducer.authStatus ?? 'unknown'}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ELayout)
    ))
