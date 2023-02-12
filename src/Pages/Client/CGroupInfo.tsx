import {withRouter} from "react-router-dom";
import {Card, Tabs, Tag} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import cApi from "Utils/API/c-api"
import {MarkdownPreview} from "../../Utils/MarkdownPreview";
import Title from "antd/es/typography/Title";
import {isValueEmpty} from "../../Utils/empty";
import ContestList from "../../Component/contest/ContestList";
import QuitGroupBtn from "../../Component/group/QuitGroupBtn";
import JoinGroupBtn from "../../Component/group/JoinGroupBtn";
import {connect} from "react-redux";
import {CommonState} from "../../Redux/Action/common";
import GroupUserListCard from "../../Component/common/GroupUserListCard";


const CGroupInfo = (props: any) => {
    const groupId = props.match.params.groupId;
    const [groupInfo, setGroupInfo] = useState<any>();
    const [activeKey, setActiveKey] = useState<string>("Announcement")

    useEffect(() => {
        cApi.getGroupInfo({groupId: groupId}).then((value: any) => {
            setGroupInfo(value)
            MarkdownPreview("AnnouncementMD", isValueEmpty(value.markdown) ? "暂无" : value.markdown)
        })
        const act = props.keyValueData["Group-C-activeKey-" + groupId]
        if (act !== undefined)
            setActiveKey(act)
    }, [])

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>

                    <div>
                        <Card
                            title={
                                <Title level={2}>{groupInfo?.title}
                                    <span style={{color: "grey"}}> (Group ID: {groupInfo?.groupId})</span>
                                </Title>
                            }
                            extra={
                                <div>
                                    {groupInfo?.status === 1 && (
                                        <Tag color={"green"}>申请中</Tag>
                                    )}
                                    {groupInfo?.status === 2 && (
                                        <QuitGroupBtn groupId={groupInfo?.groupId} groupName={groupInfo?.title}/>
                                    )}
                                    {groupInfo?.status === 3 && (
                                        <Tag color={"orange"}>申请被拒绝</Tag>
                                    )}
                                    {(groupInfo?.status === 0 || groupInfo?.status === 3) && groupInfo?.openness !== 2 && (
                                        <JoinGroupBtn groupId={groupInfo?.groupId} groupName={groupInfo?.title}/>
                                    )}
                                    {groupInfo?.status === 0 && groupInfo?.openness === 2 && (
                                        <Tag color={"red"}>私有</Tag>
                                    )}
                                </div>
                            }
                            style={{marginTop: 25}}>

                            <Tabs activeKey={activeKey} onChange={(atk) => {
                                setActiveKey(atk)
                                props.setKeyValueData("Group-C-activeKey-" + groupId, atk)
                            }}>
                                <Tabs.TabPane tab="公告" key="Announcement">
                                    <div id={"AnnouncementMD"}>
                                    </div>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="练习" key="practice">
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="考试" key="exam">
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="比赛" key="contest">
                                    <ContestList
                                        name={"GroupInfo-" + groupId + "-ContestList"}
                                        apiProp={{groupId: groupId}}
                                        useGroup={false}
                                    />
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="用户" key={"member"}>
                                    {groupInfo !== undefined && (
                                        <GroupUserListCard members={groupInfo.members}/>
                                    )}
                                </Tabs.TabPane>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: CommonState = state.CommonReducer
    return {
        keyValueData: State.keyValueData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setKeyValueData: (key: string, value: any) => dispatch({
        type: "setKeyValue",
        key: key,
        value: value
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(CGroupInfo))
