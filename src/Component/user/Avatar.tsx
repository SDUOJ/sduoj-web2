import {UserOutlined} from "@ant-design/icons";
import md5 from "js-md5";
import React from "react";
import {Avatar} from "antd";
import {AvatarSize} from "antd/es/avatar/SizeContext";
import {isValueEmpty} from "../../Utils/empty";


interface IUserAvatar {
    email?: string | null
    size?: AvatarSize
    shape?: 'circle' | 'square'
}

const UserAvatar = (props: IUserAvatar) => {
    if (!isValueEmpty(props.email)) {
        let avatarUrl = `https://cravatar.cn/avatar/${md5(props.email as string)}?d=identicon`;
        return (
            <Avatar
                src={avatarUrl}
                shape={props.shape}
                size={props.size}
            />
        )
    } else {
        return (
            <Avatar
                icon={<UserOutlined/>}
                shape={props.shape}
                size={props.size}
            />
        )
    }
}


export default UserAvatar