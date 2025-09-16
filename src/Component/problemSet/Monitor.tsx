import {Input, message, Space, Tabs, Table, Tag} from "antd";
import React, {useEffect, useMemo, useState} from "react";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import "Assert/css/ContestRank.css";
import cApi from "Utils/API/c-api";
import {unix2Time} from "../../Utils/Time";
import dealFloat from "../../Utils/dealFloat";

const Monitor = (props: any) => {
    const problemSetId = props.match.params.problemSetId

    const [rankInfo, setRankInfo] = useState<any>()
    const [lastUpdate, setLastUpdate] = useState<any>()

    const [activeTab, setActiveTab] = useState<string>("multiIp");
    const [finishedFilter, setFinishedFilter] = useState<string>("");

    const showLoading = (key: string, content: string) => {
        message.loading({key, content, duration: 0});
        return () => message.destroy(key);
    }

    useEffect(() => {
        if (rankInfo === undefined) {
            const hide = showLoading("RankLoadingHint", props.t("RankLoadingHint"))
            cApi.getProblemSummary({psid: problemSetId, code: 0}).then((res: any) => {
                setRankInfo(res.data)
                setLastUpdate(res.lastUpdate)
            }).finally(() => {
                hide()
            })
        }
    }, [problemSetId, props.t, rankInfo])

    useEffect(() => {
        setRankInfo(undefined)
        setLastUpdate(undefined)
    }, [problemSetId])

    const monitorData = useMemo(() => {
        const rankList = Array.isArray(rankInfo) ? rankInfo : []
        const ipUsageMap = new Map<string, any[]>()
        const multiIpUsers: any[] = []
        const finishedUsers: any[] = []

        rankList.forEach((row: any) => {
            const ips: string[] = Array.isArray(row.ips) ? row.ips : []
            if (ips.length > 1) {
                multiIpUsers.push({
                    key: row.username,
                    username: row.username,
                    nickname: row.nickname,
                    rank: row.rank,
                    ips,
                    ipCount: ips.length,
                })
            }
            if (row.finish === 1) {
                finishedUsers.push({
                    key: row.username,
                    username: row.username,
                    nickname: row.nickname,
                    rank: row.rank,
                    finish_time: row.finish_time,
                    sum_score: row.sum_score,
                    ips,
                })
            }
            ips.forEach((ip: string) => {
                const list = ipUsageMap.get(ip) ?? []
                list.push(row)
                ipUsageMap.set(ip, list)
            })
        })

        const sharedIpList: any[] = []
        ipUsageMap.forEach((users, ip) => {
            if (users.length > 1) {
                const simpleUsers = users.map((u: any) => ({
                    username: u.username,
                    nickname: u.nickname,
                    rank: u.rank,
                }))
                sharedIpList.push({
                    key: ip,
                    ip,
                    userCount: users.length,
                    users: simpleUsers,
                })
            }
        })

        return {
            multiIpUsers,
            sharedIpList,
            finishedUsers,
        }
    }, [rankInfo])

    const filteredFinishedUsers = useMemo(() => {
        if (finishedFilter.trim() === "") return monitorData.finishedUsers
        const keyword = finishedFilter.trim().toLowerCase()
        return monitorData.finishedUsers.filter((user) => {
            const username = (user.username ?? "").toLowerCase()
            const nickname = (user.nickname ?? "").toLowerCase()
            return username.includes(keyword) || nickname.includes(keyword)
        })
    }, [finishedFilter, monitorData.finishedUsers])

    return (
        <div style={{marginTop: 24}}>
            <div style={{fontWeight: "lighter", marginBottom: 16, marginLeft: 4}}>
                榜单更新有大约1分钟的延迟，上次更新时间：{lastUpdate ? unix2Time(lastUpdate) : undefined}
            </div>
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key)}
                items={[
                    {
                        key: "multiIp",
                        label: props.t("MonitorMultiIpUsersTitle"),
                        children: (
                            <Table
                                bordered
                                size={"middle"}
                                pagination={{pageSize: 10, showSizeChanger: false}}
                                dataSource={monitorData.multiIpUsers}
                                columns={[
                                    {
                                        title: props.t("Rank"),
                                        dataIndex: "rank",
                                        width: 80,
                                        render: (text: any) => <span className={"center"}>{text}</span>
                                    },
                                    {
                                        title: props.t("Username"),
                                        dataIndex: "username",
                                        width: 160,
                                    },
                                    {
                                        title: props.t("Nickname"),
                                        dataIndex: "nickname",
                                    },
                                    {
                                        title: props.t("IPCount"),
                                        dataIndex: "ipCount",
                                        width: 120,
                                    },
                                    {
                                        title: props.t("IPsUsedLabel"),
                                        dataIndex: "ips",
                                        render: (ips: string[]) => (
                                            <Space size={[0, 4]} wrap>
                                                {ips.map((ip) => (
                                                    <Tag key={ip}>{ip}</Tag>
                                                ))}
                                            </Space>
                                        )
                                    }
                                ]}
                                locale={{emptyText: props.t("MonitorEmptyHint")}}
                            />
                        )
                    },
                    {
                        key: "sharedIp",
                        label: props.t("MonitorSharedIpTitle"),
                        children: (
                            <Table
                                bordered
                                size={"middle"}
                                pagination={{pageSize: 10, showSizeChanger: false}}
                                dataSource={monitorData.sharedIpList}
                                columns={[
                                    {
                                        title: props.t("IPAddress"),
                                        dataIndex: "ip",
                                        width: 180,
                                    },
                                    {
                                        title: props.t("UserCount"),
                                        dataIndex: "userCount",
                                        width: 140,
                                    },
                                    {
                                        title: props.t("Users"),
                                        dataIndex: "users",
                                        render: (users: any[]) => (
                                            <Space size={[4, 4]} wrap>
                                                {users.map((user) => (
                                                    <Tag key={user.username}>{user.username}{user.nickname ? ` (${user.nickname})` : ""}</Tag>
                                                ))}
                                            </Space>
                                        )
                                    }
                                ]}
                                locale={{emptyText: props.t("MonitorEmptyHint")}}
                            />
                        )
                    },
                    {
                        key: "finished",
                        label: props.t("MonitorFinishedUsersTitle"),
                        children: (
                            <div>
                                <Input.Search
                                    placeholder={props.t("MonitorFinishedSearchPlaceholder")}
                                    allowClear
                                    onSearch={(value) => setFinishedFilter(value)}
                                    onChange={(event) => setFinishedFilter(event.target.value)}
                                    style={{marginBottom: 12, maxWidth: 320}}
                                    value={finishedFilter}
                                />
                                <Table
                                    bordered
                                    size={"middle"}
                                    pagination={{pageSize: 10, showSizeChanger: false}}
                                    dataSource={filteredFinishedUsers}
                                    columns={[
                                        {
                                            title: props.t("Rank"),
                                            dataIndex: "rank",
                                            width: 80,
                                            render: (text: any) => <span className={"center"}>{text}</span>
                                        },
                                        {
                                            title: props.t("Username"),
                                            dataIndex: "username",
                                            width: 160,
                                        },
                                        {
                                            title: props.t("Nickname"),
                                            dataIndex: "nickname",
                                        },
                                        {
                                            title: props.t("FinishTimeLabel"),
                                            dataIndex: "finish_time",
                                            width: 200,
                                            render: (time: number) => time ? unix2Time(time) : "-"
                                        },
                                        {
                                            title: props.t("TotalScore"),
                                            dataIndex: "sum_score",
                                            width: 140,
                                            render: (score: number) => dealFloat(score)
                                        },
                                        {
                                            title: props.t("IPsUsedLabel"),
                                            dataIndex: "ips",
                                            render: (ips: string[]) => (
                                                <Space size={[0, 4]} wrap>
                                                    {ips?.map((ip) => (
                                                        <Tag key={ip}>{ip}</Tag>
                                                    ))}
                                                </Space>
                                            )
                                        }
                                    ]}
                                    locale={{emptyText: props.t("MonitorEmptyHint")}}
                                />
                            </div>
                        )
                    }
                ]}
            />
        </div>
    )
}

export default withTranslation()(withRouter(Monitor))
