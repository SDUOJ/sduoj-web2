import React, {Component, Dispatch} from "react";
import {Button, Divider, Dropdown, Layout, Menu, message, Space} from "antd";
import ChangeLang from "../common/ChangeLang";
import {Link} from "react-router-dom";
import {DownOutlined, LogoutOutlined, RightOutlined, UserOutlined} from "@ant-design/icons";
import logo from "../../Assert/img/logo.png";
import {UserState} from "../../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {testLoginTodo, userLogoutTodo} from "../../Redux/Action/user";
import UserAvatar from "../user/Avatar";
import judgeAuth from "../../Utils/judgeAhtu";
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
                    style={{minWidth: 550, position: 'fixed', zIndex: 1, width: '100%'}}>
                <div className="logo" style={{float: "left", marginTop: "-5px", marginLeft: "-10px"}} key={"logo"}>
                    <img src={logo} style={{width: "125px", height: '30px'}}
                         alt={"SDUOJ-logo"}/>
                </div>
                <div style={{float: "left", width: "600px"}}>
                    <Menu
                        mode="horizontal"
                        theme={"light"}
                        selectedKeys={[this.state.selectedKey]}
                    >
                        {
                            routerC_M.map((r, i) => {
                                return (
                                    <Menu.Item key={r.id} icon={r.icon}>
                                        <Link to={r.path}>{this.props.t(r.title_i18n)}</Link>
                                    </Menu.Item>
                                )

                            })
                        }
                    </Menu>
                </div>
                <div style={{float: "right"}} key={"operator"}>
                    <Space size={30}>
                        <Button type={"text"} onClick={()=>{
                            this.props.history.replace("/home")
                            window.location.reload()
                        }}>返回老版</Button>
                        <ChangeLang/>
                        {
                            [''].map(() => {
                                if (this.props.isLogin) {
                                    return (
                                        <Dropdown overlay={
                                            <Menu>
                                                {
                                                    this.props.roles !== undefined &&
                                                    judgeAuth(this.props.roles, ["admin", "superadmin"]) &&
                                                    (
                                                        <Menu.Item
                                                            key="0"
                                                            icon={<RightOutlined />}
                                                            onClick={() => {
                                                                this.props.history.push(UrlPrefix + "/manage")
                                                            }}
                                                        >
                                                            {this.props.t("toManage")}
                                                        </Menu.Item>
                                                    )
                                                }
                                                <Menu.Item
                                                    key="1"
                                                    icon={<UserOutlined/>}
                                                    onClick={() => {
                                                        this.props.history.push(UrlPrefix + "/user")
                                                    }}
                                                >
                                                    {this.props.t("Profile")}
                                                </Menu.Item>
                                                <Menu.Item
                                                    key="2"
                                                    icon={<LogoutOutlined/>}
                                                    onClick={()=>{
                                                        this.props.userLogout()
                                                        setTimeout(()=>{
                                                            this.props.history.push(UrlPrefix + "/home")
                                                        }, 200)
                                                        message.info("已退出登录")
                                                    }}
                                                >
                                                    {this.props.t("Logout")}
                                                </Menu.Item>
                                            </Menu>
                                        }>
                                            <Button type="text" size={"large"}>
                                                <Space>
                                                    <div style={{marginTop: -10}}>
                                                        <UserAvatar email={this.props.email}/>
                                                        <Divider type="vertical"/>
                                                        {this.props.username}
                                                    </div>
                                                    <DownOutlined style={{fontSize: 10, marginBottom: 20}}/>
                                                </Space>
                                            </Button>
                                        </Dropdown>
                                    )
                                } else {
                                    return (
                                        <>
                                            <Space>
                                                <Button type={"text"} onClick={()=>{
                                                    this.props.history.push(UrlPrefix + "/login?to=" + this.props.location.pathname)
                                                }}>登录 / 注册</Button>
                                            </Space>
                                        </>
                                    )
                                }
                            })
                        }
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
    testLogin: () => dispatch(testLoginTodo()),
    userLogout: () => dispatch(userLogoutTodo()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(CHeader)
    ))