import React, {Component, Dispatch} from "react";
import UserAvatarBack from "../user/UserAvatarBack";
import {Avatar, Button, Divider, Dropdown, Layout, Menu, message, Space} from "antd";
import ChangeLang from "../common/ChangeLang";
import {Link, RouteComponentProps} from "react-router-dom";
import {AppstoreOutlined, DownOutlined, LogoutOutlined, MailOutlined, UserOutlined} from "@ant-design/icons";
import md5 from "js-md5";
import logo from "../../Assert/img/logo.png";
import {ExamState, IUserExamInfo} from "../../Type/IExam";
import {IUserPropRoles, UserState} from "../../Type/Iuser";
import {examID} from "../../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {testLoginTodo, userGetProfileTodo, userLogoutTodo} from "../../Redux/Action/user";
import ExamOver from "../exam/ExamOver";
import {routerC_M, routerM} from "../../Config/router";

const {Header} = Layout;

class CHeader extends Component<any, any> {
    constructor(props: any, context: any) {
        super(props, context);
        this.state = {selectedKey: '0'}
    }

    componentDidMount() {
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

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
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

    render() {
        return (
            <Header className="site-layout-sub-header-background"
                    style={{minWidth: 550, position: 'fixed', zIndex: 1, width: '100%'}}>
                <div className="logo" style={{float: "left", marginTop: "-5px", marginLeft: "-10px"}} key={"logo"}>
                    <img src={logo} style={{width: "125px", height: '30px'}}
                         alt={"SDUOJ-logo"}/>
                </div>
                <div style={{float: "left", width: "500px"}}>
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
                        <ChangeLang/>
                        {
                            [''].map(() => {
                                if (this.props.isLogin) {
                                    return (
                                        <Dropdown overlay={
                                            <Menu>
                                                <Menu.Item
                                                    key="1"
                                                    icon={<UserOutlined/>}
                                                    onClick={() => {

                                                    }}
                                                >
                                                    {this.props.t("Profile")}
                                                </Menu.Item>
                                                <Menu.Item
                                                    key="2"
                                                    icon={<LogoutOutlined/>}
                                                    onClick={()=>{
                                                        this.props.userLogout()
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
                                                        {this.props.realName}
                                                        <Divider type="vertical"/>
                                                        {this.props.sduId}
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
                                                    this.props.history.push("/v2/login")
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
    const State: ExamState = state.ExamReducer
    const realName = UState.userInfo?.realName
    const sduId = UState.userInfo?.sduId
    return {
        isLogin: UState.isLogin,
        realName: (realName === undefined || realName === null) ? UState.userInfo?.nickname : UState.userInfo?.realName,
        sduId: (sduId === undefined || sduId === null) ? UState.userInfo?.studentId : UState.userInfo?.sduId,
        ExamInfoLoad: State.ExamInfoLoad,
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