import React, {Component} from "react";
import {Button, Divider, Dropdown, Menu, Space} from "antd";
import {withRouter} from "react-router-dom";
import {DownOutlined, RightOutlined} from '@ant-design/icons';
import {withTranslation} from "react-i18next";
import UserAvatar from "./Avatar";
import {UrlPrefix} from "../../Config/constValue";


class UserAvatarBack extends Component<any, any> {
    render() {
        return (
            <>
                <Dropdown overlay={
                    <Menu>

                        <Menu.Item
                            key="0"
                            icon={<RightOutlined/>}
                            onClick={() => {
                                this.props.history.push(UrlPrefix + "/")
                            }}
                        >
                            {this.props.t("backToOJ")}
                        </Menu.Item>
                    </Menu>
                }>
                    <Button type="text" size={"large"}>
                        <Space>
                            <div style={{marginTop: -10}}>
                                {
                                    this.props.email !== null && (
                                        <>
                                            <UserAvatar email={this.props.email}/>
                                            <Divider type="vertical"/>
                                        </>
                                    )
                                }
                                {this.props.username}
                            </div>
                            <DownOutlined style={{fontSize: 10, marginBottom: 20}}/>
                        </Space>
                    </Button>
                </Dropdown>
            </>
        )
    }
}

export default withTranslation()(withRouter(UserAvatarBack))
