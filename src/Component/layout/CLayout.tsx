import React, {Component, Dispatch, Suspense} from "react";
import {Layout} from "antd";
import Loading from "../../Utils/Loading";
import {Route} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import FooterSDU from "./FooterSDU";
import CHeader from "./CHeader";
import {routerC} from "../../Config/router/routerC";
import {ContestState} from "../../Redux/Action/contest";
import {UrlPrefix} from "../../Config/constValue";
import LoginCheck from "../common/LoginCheck";

const {Content} = Layout;

class MLayout extends Component<any, any> {

    componentDidMount() {
        if (this.props.location.pathname === UrlPrefix || this.props.location.pathname === UrlPrefix + '/') {
            this.props.history.push(UrlPrefix + "/home");
        }
    }

    render() {

        let minWidth = 500
        if (this.props.location.pathname.match(/\/contest\/.*\/rank/g) !== null) {
            minWidth = Math.max(500, (this.props.minWidth ?? 0) + 100)
        }

        return (
            <>
                <LoginCheck/>
                <Layout style={{height: "max-content", minHeight: "100%", minWidth: "1300px"}}>
                    <Layout style={{minWidth: minWidth}}>
                        <CHeader/>
                        <Content style={{
                            backgroundColor: "#ffffff",
                            paddingTop: 64,
                            margin: '20px 16px 0',
                            display: "table",
                            height: "auto"
                        }}>
                            <Suspense fallback={<Loading/>}>
                                {routerC.map(({id, path, exact, component}) => {
                                    return (
                                        <Route
                                            key={id} path={path} exact={exact}
                                            component={component}/>
                                    )
                                })}
                            </Suspense>
                        </Content>
                        <FooterSDU/>
                    </Layout>
                </Layout>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const CState: ContestState = state.ContestReducer
    return {
        minWidth: CState.minWidth
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(MLayout)))
