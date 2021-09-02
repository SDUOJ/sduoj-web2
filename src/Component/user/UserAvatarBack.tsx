import React, {Component} from "react";
import {Button, Popover, Space} from "antd";
import {IUserPropAvatar} from "../../Type/Iuser";
import {BrowserRouter as Router, Link} from "react-router-dom";
import {RightOutlined} from '@ant-design/icons';
import {withTranslation} from "react-i18next";
import UserAvatarBase from "./UserAvatar";


class UserAvatarBack extends Component<IUserPropAvatar, any> {
    render() {
        return (
            <>
                <Router>
                    <Popover content={this.props.t("backToOJ")}>
                        <Button type="text" size={"large"}>
                            <Link to={'/'}>
                                <Space>
                                    <UserAvatarBase
                                        id={this.props.id}
                                        email={this.props.email}
                                        username={this.props.username}
                                        t={this.props.t}
                                        i18n={this.props.i18n}
                                        tReady={this.props.tReady}/>
                                    <RightOutlined style={{fontSize: 10, marginBottom: 20}}/>
                                </Space>

                            </Link>
                        </Button>
                    </Popover>

                </Router>

            </>
        )
    }
}

export default withTranslation()(UserAvatarBack)