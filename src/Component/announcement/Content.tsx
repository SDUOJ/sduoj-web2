import React, {useEffect, useState} from 'react';
import {Comment, Tooltip} from 'antd';
import moment from 'moment';
// import {DislikeFilled, DislikeOutlined, LikeFilled, LikeOutlined} from '@ant-design/icons';
import {withTranslation} from "react-i18next";
import UserAvatar from "../user/Avatar";
import CApi from "Utils/API/c-api"
import MarkdownText from "../../Utils/MarkdownText";

const ANCContent = (props: any) => {

    // const [likes, setLikes] = useState(0);
    // const [dislikes, setDislikes] = useState(0);
    // const [action, setAction] = useState<number>(0);

    // const reset = () => {
    //     if (action === 1) setLikes(likes - 1);
    //     if (action === -1) setDislikes(dislikes - 1);
    //     setAction(0);
    // }
    //
    // const like = () => {
    //     if (action !== 1) setLikes(likes + 1);
    //     if (action === -1) setDislikes(dislikes - 1);
    //     setAction(1);
    // };
    //
    // const dislike = () => {
    //     if (action === 1) setLikes(likes - 1);
    //     if (action !== -1) setDislikes(dislikes + 1);
    //     setAction(-1);
    // };

    // 赞与踩 的模块 （暂时不用）

    // const actions = [
    //     <Tooltip key="comment-basic-like" title={props.t("Like")}>
    //         <span onClick={() => {
    //             if (action !== 1) like()
    //             else reset()
    //         }}>
    //             {
    //                 createElement(action === 1 ? LikeFilled : LikeOutlined)
    //             }
    //             <span className="comment-action">{likes}</span>
    //         </span>
    //     </Tooltip>,
    //     <Tooltip key="comment-basic-dislike" title={props.t("Dislike")}>
    //         <span onClick={() => {
    //             if (action !== -1) dislike()
    //             else reset()
    //         }}>
    //             {
    //                 React.createElement(action === -1 ? DislikeFilled : DislikeOutlined)
    //             }
    //             <span className="comment-action">{dislikes}</span>
    //         </span>
    //     </Tooltip>,
    // ];

    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>();
    const [time, setTime] = useState<number>(Date.now());
    const [text, setText] = useState<number>(Date.now());

    useEffect(() => {
        if (props.id !== 0) {
            CApi.getAnnouncement({id: props.id}).then((data: any) => {
                setEmail(data.email);
                setUsername(data.username)
                setTime(parseInt(data.gmtCreate))
                setText(data.text)
            })
        }
    }, [props.id])


    return (
        <>
            <Comment
                // actions={actions}
                author={username !== undefined ? username : ""}
                avatar={<UserAvatar email={email}/>}
                content={
                    <MarkdownText id={"markdownPreview"} text={text}/>
                }
                datetime={
                    <Tooltip title={moment(time).format('YYYY-MM-DD HH:mm:ss')}>
                        <span>{moment(time).fromNow()}</span>
                    </Tooltip>
                }
            />
        </>
    )
}

export default withTranslation()(ANCContent)

