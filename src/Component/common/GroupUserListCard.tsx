import Search from "antd/es/input/Search";
import {Card, List, Space} from "antd";
import UserAvatar from "../user/Avatar";
import {isValueEmpty} from "../../Utils/empty";
import React, {useState} from "react";
import {useTranslation} from "react-i18next";
import "./GroupUserListCard.css"

const GroupUserListCard = (props: any) => {

    const [searchKey, setSearchKey] = useState<string>()
    const [pageNow, setPageNow] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(24)

    const {t} = useTranslation()

    return (
        <>
            <Card
                // bordered={false}
                variant={"borderless"}
                extra={
                    <Space>
                        <div>{t("search")}:</div>
                        <Search
                            key={"search"}
                            onSearch={(text) => {
                                setSearchKey(text)
                                setPageNow(1)
                            }}
                            style={{width: 300}}
                        />
                    </Space>
                }
            >
                <List
                    bordered={false}
                    grid={{gutter: 8, column: 6, lg: 6, xl: 6, md: 4, sm: 4, xs: 2}}
                    dataSource={props.members.filter((item: any) => {
                        if (isValueEmpty(searchKey)) return true;
                        return item.username.indexOf(searchKey) !== -1 || item.nickname.indexOf(searchKey) !== -1
                    })}
                    renderItem={(item: any) => (
                        <List.Item key={item.username} className={"group-user-list"}>
                            <List.Item.Meta
                                avatar={<UserAvatar email={item.email} />}
                                title={<div className="group-user-name" title={item.username}>{item.username}</div>}
                                description={<div className="group-user-nickname" title={item.nickname}>{item.nickname}</div>}
                            />
                        </List.Item>
                    )}
                    pagination={{
                        total: props.members.length,
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
                />
            </Card>
        </>
    )
}

export default GroupUserListCard
