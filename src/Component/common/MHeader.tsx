import React, {Component} from "react";
import UserAvatarBack from "../user/UserAvatarBack";
import {Layout} from "antd";
import ChangeLang from "./ChangeLang";

const {Header} = Layout;

export default class MHeader extends Component<any, any>{
    render() {
        return (
            <Header className="site-layout-sub-header-background" style={{minWidth: 550}}>
                <div style={{float: "right"}}>
                    <UserAvatarBack email={"735961159@qq.com"} id={1} username={"yhf2000"}/>
                    <ChangeLang/>
                </div>
            </Header>
        )
    }
}
