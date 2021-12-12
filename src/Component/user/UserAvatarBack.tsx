import React, {Component} from "react";
import {Avatar, Button, Divider, Popover, Space} from "antd";
import {IUserPropAvatar} from "../../Type/Iuser";
import {BrowserRouter as Router, Link} from "react-router-dom";
import {RightOutlined, UserOutlined} from '@ant-design/icons';
import {WithTranslation, withTranslation} from "react-i18next";
import md5 from "js-md5";


class UserAvatarBack extends Component<any, any> {
    render() {
        return (
            <>
                <Router>
                    <Popover content={this.props.t("backToOJ")}>
                        <Button type="text" size={"large"}>
                            <Link to={'/'}>
                                <Space>
                                    <div style={{marginTop: -10}}>
                                        <Avatar icon={<UserOutlined/>}
                                                src={"https://gravatar.inwao.com/avatar/" + md5(this.props.email)} alt={"头像"}
                                        />
                                        <Divider type="vertical"/>
                                        {this.props.username}
                                    </div>
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