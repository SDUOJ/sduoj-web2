import React, {Component} from "react";
import {Avatar, Divider} from "antd";
import {IUserPropAvatar} from "./Iuser";
import {UserOutlined} from '@ant-design/icons';
import md5 from 'js-md5'


export default class UserAvatarBase extends Component<IUserPropAvatar, any> {

    render() {
        return (
            <>
                <div style={{marginTop: -10}}>
                    <Avatar icon={<UserOutlined/>}
                            src={"https://gravatar.inwao.com/avatar/" + md5(this.props.email)} alt={"头像"}

                    />
                    <Divider type="vertical"/>
                    {this.props.username}
                </div>
            </>
        )
    }
}

