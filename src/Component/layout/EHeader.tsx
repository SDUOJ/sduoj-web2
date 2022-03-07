import React, {Component, Dispatch} from "react";
import {Button, Divider, Dropdown, Layout, Menu, message, Space} from "antd";
import ChangeLang from "../common/ChangeLang";
import {DownOutlined, LogoutOutlined} from "@ant-design/icons";
import logo from "../../Assert/img/logo.png";
import {ExamState} from "../../Type/IExam";
import {UserState} from "../../Type/Iuser";
import {connect, useDispatch} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {userGetProfileTodo, userLogoutTodo} from "../../Redux/Action/user";
import ExamOver from "../exam/ExamOver";

const {Header} = Layout;

const EHeader = (props: any) => {

    const dispatch = useDispatch()
    return (
        <Header className="site-layout-sub-header-background" style={{minWidth: 550}}>
            <div className="logo" style={{float: "left", marginTop: "-5px", marginLeft: "-10px"}} key={"logo"}>
                <img src={logo} style={{width: "125px", height: '30px'}}
                     alt={"SDUOJ-logo"}/>
            </div>
            <div style={{float: "right"}} key={"operator"}>
                {props.location.pathname.match(/\/exam\/running\//) !== null && (
                    <ExamOver key={"ExamOver"}/>
                )}
                <ChangeLang/>
                {
                    [''].map(() => {
                        if (props.isLogin) {
                            return (
                                <Dropdown overlay={
                                    <Menu onClick={() => {
                                        props.userLogout()
                                        message.info("已退出登录")
                                    }}>
                                        <Menu.Item key="1" icon={<LogoutOutlined/>}>
                                            {props.t("Logout")}
                                        </Menu.Item>
                                    </Menu>
                                }>
                                    <Button type="text" size={"large"}>
                                        <Space>
                                            <div style={{marginTop: -10}}>
                                                {props.realName}
                                                <Divider type="vertical"/>
                                                {props.sduId}
                                            </div>
                                            <DownOutlined style={{fontSize: 10, marginBottom: 20}}/>
                                        </Space>
                                    </Button>
                                </Dropdown>
                            )
                        }
                    })
                }
            </div>
        </Header>
    )
    
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const realName = UState.userInfo?.realName
    const sduId = UState.userInfo?.sduId
    return {
        isLogin: UState.isLogin,
        realName: (realName === undefined || realName === null) ? UState.userInfo?.nickname : UState.userInfo?.realName,
        sduId: (sduId === undefined || sduId === null) ? UState.userInfo?.studentId : UState.userInfo?.sduId,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    userLogout: () => dispatch(userLogoutTodo()),
    getProfile: () => dispatch(userGetProfileTodo()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(EHeader)
    ))