import React, { FC, useEffect, useState } from "react";
import {Button, Divider, Dropdown, Layout, Menu, message, Space} from "antd";
import ChangeLang from "../common/ChangeLang";
import {Link} from "react-router-dom";
import {DownOutlined, LogoutOutlined, RightOutlined, UserOutlined} from "@ant-design/icons";
import logo from "../../Assert/img/logo.png";
import {UserState} from "../../Type/Iuser";
import {connect} from "react-redux";
import { Dispatch } from "redux";
import {withTranslation} from "react-i18next";
import { withRouter, RouteComponentProps } from "react-router";
import { userLogoutTodo } from "../../Redux/Action/user";
import UserAvatar from "../user/Avatar";
import judgeAuth from "../../Utils/judgeAhtu";
import {routerC_M} from "../../Config/router/routerC";
import {UrlPrefix} from "../../Config/constValue";

const { Header } = Layout;

interface CHeaderProps extends RouteComponentProps {
    isLogin: boolean;
    username?: string;
    email?: string;
    roles?: string[];
    t: any;
    userLogout: () => void;
}

const CHeader: FC<CHeaderProps> = ({
    location,
    history,
    isLogin,
    username,
    email,
    roles,
    t,
    userLogout,
}) => {
    const [selectedKey, setSelectedKey] = useState('0');

    const syncSelect = () => {
        for (let i = 0; i < routerC_M.length; i++) {
            if (location.pathname === routerC_M[i].path) {
                if (selectedKey !== routerC_M[i].id.toString()) {
                    setSelectedKey(routerC_M[i].id.toString());
                }
            }
        }
    };

    useEffect(() => {
        syncSelect();
        try {
            "test".replaceAll("t", "1");
        } catch (e) {
            history.replace(UrlPrefix + "/error/browser");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        syncSelect();
    }, [location.pathname]);

    return (
        <Header
            className="site-layout-sub-header-background"
            style={{ position: 'fixed', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between' }}
        >
            <div className="logo" style={{flex: "125px 0 0", marginTop: "-5px", marginLeft: "-10px"}} key={"logo"}>
                <img src={logo} style={{width: "125px", height: '30px'}}
                     alt={"SDUOJ-logo"}/>
            </div>
            <div style={{minWidth: 0, flex: "auto"}}>
                <Menu
                    mode="horizontal"
                    theme={"light"}
                    selectedKeys={[selectedKey]}
                    style={{}}
                >
                    {
                        routerC_M.map((r) => {
                            return (
                                <Menu.Item key={r.id} icon={r.icon}>
                                    <Link to={r.path}>{t(r.title_i18n)}</Link>
                                </Menu.Item>
                            );
                        })
                        }
                    </Menu>
                </div>
                <div style={{flex: "0"}} key={"operator"}>
                    <Space size={30}>
                        {/*<Button type={"text"} onClick={()=>{*/}
                        {/*    this.props.history.replace("/home")*/}
                        {/*    window.location.reload()*/}
                        {/*}}>返回老版</Button>*/}
                        <ChangeLang/>
                        {
                            [''].map(() => {
                                if (isLogin) {
                                    return (
                                        <Dropdown overlay={
                                            <Menu>
                                                {
                                                    roles !== undefined &&
                                                    judgeAuth(roles, ["admin", "superadmin"]) &&
                                                    (
                                                        <Menu.Item
                                                            key="0"
                                                            icon={<RightOutlined />}
                                                            onClick={() => {
                                                                history.push(UrlPrefix + "/manage")
                                                            }}
                                                        >
                                                            {t("toManage")}
                                                        </Menu.Item>
                                                    )
                                                }
                                                <Menu.Item
                                                    key="1"
                                                    icon={<UserOutlined/>}
                                                    onClick={() => {
                                                        history.push(UrlPrefix + "/user")
                                                    }}
                                                >
                                                    {t("Profile")}
                                                </Menu.Item>
                                                <Menu.Item
                                                    key="2"
                                                    icon={<LogoutOutlined/>}
                                                    onClick={()=>{
                                                        userLogout()
                                                        setTimeout(()=>{
                                                            history.push(UrlPrefix + "/home")
                                                        }, 200)
                                                        message.info("已退出登录")
                                                    }}
                                                >
                                                    {t("Logout")}
                                                </Menu.Item>
                                            </Menu>
                                        }>
                                            <Button type="text" size={"large"}>
                                                <Space>
                                                    <div style={{marginTop: -10}}>
                                                        <UserAvatar email={email}/>
                                                        <Divider type="vertical"/>
                                                        {username}
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
                                                    history.push(UrlPrefix + "/login?to=" + location.pathname)
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
        );
};


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
