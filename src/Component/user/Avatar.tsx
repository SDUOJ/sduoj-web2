import {UserOutlined} from "@ant-design/icons";
import md5 from "js-md5";
import React from "react";
import {Avatar} from "antd";
import {AvatarSize} from "antd/es/avatar/SizeContext";


interface IUserAvatar {
    email?: string | null
    size?: AvatarSize
}

const UserAvatar = (props: IUserAvatar) => {
    if (props.email !== undefined && props.email !== null) {
        return (
            <Avatar
                src={"https://cravatar.cn/avatar/" + md5(props.email) +
                (typeof props.size === "number" ? "?s=" + props.size : "") +
                (typeof props.size === "number" ? "&d=identicon": "?d=identicon")
                }
                alt={"头像"}
                size={props.size}
            />
        )
    } else {
        return (
            <Avatar icon={<UserOutlined/>}/>
        )
    }
}

export default UserAvatar