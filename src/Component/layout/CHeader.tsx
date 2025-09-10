import React, {Component, Dispatch} from "react";
import {Button, Layout, Menu, message, Space} from "antd";
import ChangeLang from "../common/ChangeLang";
import {Link} from "react-router-dom";
// icons moved into UserAccountDropdown
import logo from "../../Assert/img/logo.png";
import {UserState} from "../../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {userLogoutTodo} from "../../Redux/Action/user";
import UserAccountDropdown from './UserAccountDropdown';
import {routerC_M} from "../../Config/router/routerC";
import {UrlPrefix} from "../../Config/constValue";

const {Header} = Layout;

class CHeader extends Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {selectedKey: '0'}
    }

    syncSelect = ()=>{
        for (let i = 0; i < routerC_M.length; i++) {
            if (this.props.location.pathname === routerC_M[i].path) {
                if (this.state.selectedKey !== routerC_M[i].id.toString()) {
                    this.setState({
                        selectedKey: routerC_M[i].id.toString()
                    })
                }
            }
        }
    }

    componentDidMount() {
        this.syncSelect()
        try{
            "test".replaceAll("t", "1")
        }catch (e){
            this.props.history.replace(UrlPrefix + "/error/browser")
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        this.syncSelect()
    }

    render() {
        return (
        <Header className="site-layout-sub-header-background"
            style={{position: 'fixed', zIndex: 1, width: '100%', display: "flex", justifyContent: "space-between", alignItems: 'center', height: 64, padding: '0 20px'}}>
                <div className="logo" style={{flex: "125px 0 0", display:'flex', alignItems:'center'}} key={"logo"}>
                    <img src={logo} style={{width: 125, height: 30}}
                         alt={"SDUOJ-logo"} />
                </div>
                <div style={{minWidth: 0, flex: "auto"}}>
                    <Menu
                        mode="horizontal"
                        theme="light"
                        selectedKeys={[this.state.selectedKey]}
                        items={routerC_M.map((r:any) => ({
                            key: r.id,
                            icon: r.icon,
                            label: <Link to={r.path}>{this.props.t(r.title_i18n)}</Link>
                        }))}
                    />
                </div>
                <div style={{flex: "0"}} key={"operator"}>
                    <Space size={30}>
                        {/*<Button type={"text"} onClick={()=>{*/}
                        {/*    this.props.history.replace("/home")*/}
                        {/*    window.location.reload()*/}
                        {/*}}>返回老版</Button>*/}
                        <ChangeLang/>
                                                {this.props.isLogin ? (
                                                    <UserAccountDropdown
                                                        isLogin={true}
                                                        mode="console"
                                                        username={this.props.username}
                                                        email={this.props.email}
                                                        roles={this.props.roles}
                                                        onToManage={() => this.props.history.push(UrlPrefix + "/manage")}
                                                        onToProfile={() => this.props.history.push(UrlPrefix + "/user")}
                                                        onLogout={() => {
                                                            this.props.userLogout();
                                                            setTimeout(() => {
                                                                this.props.history.push(UrlPrefix + "/home")
                                                            }, 200);
                                                            message.info(this.props.t('LogoutSuccess', {defaultValue: this.props.t('Logout')}));
                                                        }}
                                                    />
                                                ) : (
                                                    <Space>
                                                        <Button type={"text"} onClick={() => {
                                                            this.props.history.push(UrlPrefix + "/login?to=" + this.props.location.pathname)
                                                        }}>{this.props.t('LoginOrRegister', {defaultValue: this.props.t('Login') + ' / ' + this.props.t('Register')})}</Button>
                                                    </Space>
                                                )}
                    </Space>
                </div>
            </Header>
        )
    }
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer

    return {
        isLogin: UState.isLogin,
        username: UState.userInfo?.username,
        email: UState.userInfo?.email,
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    userLogout: () => dispatch(userLogoutTodo()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(CHeader)
    ))
