import {UserOutlined} from "@ant-design/icons";
import md5 from "js-md5";
import React from "react";
import {Avatar} from "antd";


interface IUserAvatar {
    email?: string | null
}

const UserAvatar = (props: IUserAvatar) => {
    if (props.email !== undefined && props.email !== null) {
        return (
            <Avatar
                src={"https://sdn.geekzu.org/avatar/" + md5(props.email)}
                alt={"头像"}
            />
        )
    } else {
        return (
            <Avatar icon={<UserOutlined/>}/>
        )
    }
}

export default UserAvatar