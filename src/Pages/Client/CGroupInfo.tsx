import {withRouter} from "react-router-dom";
import {Card, List, Row, Tabs, Tag} from "antd";
import React, {useEffect, useState} from "react";
import cApi from "Utils/API/c-api"
import {MarkdownPreview} from "../../Utils/MarkdownPreview";
import Title from "antd/es/typography/Title";
import UserAvatar from "../../Component/user/Avatar";
import Search from "antd/es/input/Search";
import {isValueEmpty} from "../../Utils/empty";
import ContestList from "../../Component/contest/ContestList";
import QuitGroupBtn from "../../Component/group/QuitGroupBtn";
import JoinGroupBtn from "../../Component/group/JoinGroupBtn";


const CGroupInfo = (props: any) => {
    const groupId = props.match.params.groupId;
    const [groupInfo, setGroupInfo] = useState<any>();
    const [searchKey, setSearchKey] = useState<string>()
    const [pageNow, setPageNow] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(24)


    useEffect(() => {
        cApi.getGroupInfo({groupId: groupId}).then((value: any) => {
            setGroupInfo(value)
            MarkdownPreview("AnnouncementMD", isValueEmpty(value.markdown) ? "暂无" : value.markdown)
        })
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

                            <Tabs defaultActiveKey="Announcement">
                                <Tabs.TabPane tab="公告" key="Announcement">
                                    <div id={"AnnouncementMD"}>
                                    </div>
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="比赛" key="contest">
                                    <ContestList
                                        apiProp={{groupId: groupId}}
                                        useGroup={false}
                                    />
                                </Tabs.TabPane>
                                <Tabs.TabPane tab="用户" key={"member"}>
                                    <Card
                                        bordered={false}
                                        extra={
                                            <>
                                                <Search
                                                    key={"search"}
                                                    placeholder={""}
                                                    onSearch={(text) => {
                                                        setSearchKey(text)
                                                        setPageNow(1)
                                                    }}
                                                    enterButton
                                                    style={{width: 300, paddingTop: 8}}
                                                />
                                            </>
                                        }
                                    >
                                        <List
                                            bordered={false}
                                            grid={{gutter: 8, column: 6, lg: 6, xl: 6, md: 4, sm: 4, xs: 2}}
                                            renderItem={(item: any) => {
                                                return (
                                                    <List.Item.Meta
                                                        style={{padding: 12}}
                                                        title={item.username}
                                                        avatar={<UserAvatar email={item.email}/>}
                                                        description={item.nickname}
                                                    />
                                                )
                                            }}
                                            dataSource={groupInfo?.members.filter((item: any) => {
                                                if (isValueEmpty(searchKey)) return true;
                                                return item.username.indexOf(searchKey) != -1 || item.nickname.indexOf(searchKey) != -1
                                            })}
                                            pagination={{
                                                total: groupInfo?.members.length,
                                                size: "small",
                                                pageSizeOptions: ["24", "48", "72"],
                                                defaultPageSize: 24,
                                                hideOnSinglePage: true,
                                                showQuickJumper: true,
                                                showLessItems: true,
                                                current: pageNow,
                                                pageSize: pageSize,
                                                onChange: (pageNow, pageSize) => {
                                                    setPageNow(pageNow)
                                                    setPageSize(pageSize)
                                                }
                                            }}
                                        >
                                        </List>
                                    </Card>
                                </Tabs.TabPane>
                            </Tabs>
                        </Card>
                    </div>

                </div>
            </div>
        </>
    )
}

export default withRouter(CGroupInfo)