import cApi from "../../Utils/API/c-api";
import {Divider, Form, List, Select, Space, Tag} from "antd";
import moment from "moment";
import {ClockCircleOutlined, LockFilled, TeamOutlined} from "@ant-design/icons";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import React, {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import TableWithPagination from "../common/Table/TableWithPagination";

const ContestList = (props: any) => {
    const [myGroup, setMyGroup] = useState<any>(undefined)

    useEffect(() => {
        cApi.getMyGroup().then((res: any) => {
            setMyGroup(res)
        })
    }, [])

    return (
        <>
            <div className={"ListPage"}>
                <TableWithPagination
                    useList={true}
                    title={"比赛列表"}
                    API={async (data: any) => {
                        return cApi.getContestList({...data, ...props.apiProp})
                    }}
                    size={"small"}
                    getForm={(onFinish: any) => {
                        return (
                            <Space size={30}>
                                {props.useGroup === undefined && myGroup !== undefined && (
                                    <Form.Item label={"组"} name={"groupId"}>
                                        <Select onChange={onFinish} style={{width: 200}}
                                                defaultValue={""}>
                                            <Select.Option value={""}>全部</Select.Option>
                                            {myGroup.map((val: any) => {
                                                return (
                                                    <Select.Option value={val.groupId}>
                                                        {val.groupId}: {val.title}
                                                    </Select.Option>
                                                )
                                            })}
                                        </Select>
                                    </Form.Item>
                                )}
                                <Form.Item label={"赛制"} name={"mode"}>
                                    <Select onChange={onFinish} style={{width: 80}}
                                            defaultValue={""}>
                                        <Select.Option value={""}>全部</Select.Option>
                                        <Select.Option value={"acm"}>ACM</Select.Option>
                                        <Select.Option value={"ioi"}>IOI</Select.Option>
                                        <Select.Option value={"oi"}>OI</Select.Option>
                                    </Select>
                                </Form.Item>
                            </Space>
                        )
                    }}
                    useFormBtn={false}
                    defaultPageSize={15}
                    renderItem={(item: any) => {
                        return (
                            <List.Item
                                key={item.contestId}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div style={{}}>
                                            <div style={{textAlign: "center", fontSize: "30px"}}>
                                                {moment(parseInt(item.gmtStart)).format("DD")}
                                            </div>
                                            <div style={{color: "#aaa"}}>
                                                {moment(parseInt(item.gmtStart)).format("YYYY-MM")}
                                            </div>
                                        </div>
                                    }
                                    title={
                                        <>
                                            <a type={"text"} style={{marginRight: 10}}
                                               onClick={() => {
                                                   props.history.push(UrlPrefix + "/contest/" + item.contestId)
                                               }}>{item.contestTitle}</a>
                                            {item.features.openness === "private" && (
                                                <LockFilled style={{color: "red"}}/>
                                            )}
                                            {item.features.openness === "protected" && (
                                                <LockFilled style={{color: "orange"}}/>
                                            )}
                                        </>
                                    }
                                    description={
                                        <Space size={10}>
                                            {item.features.mode === "acm" && (
                                                <span style={{
                                                    backgroundColor: "#3676b6",
                                                    color: "#fff",
                                                    padding: "0 10px",
                                                    borderRadius: ".75rem"
                                                }}>ACM</span>
                                            )}
                                            {item.features.mode === "ioi" && (
                                                <span style={{
                                                    backgroundColor: "#ea517f",
                                                    color: "#fff",
                                                    padding: "0 10px",
                                                    borderRadius: ".75rem"
                                                }}>IOI</span>
                                            )}
                                            {item.features.mode === "oi" && (
                                                <span style={{
                                                    backgroundColor: "#f8df72",
                                                    color: "#fff",
                                                    padding: "0 10px",
                                                    borderRadius: ".75rem"
                                                }}>OI</span>
                                            )}
                                            <Divider type={"vertical"}/>
                                            <span>{moment(parseInt(item.gmtStart)).format("HH:mm:ss")}</span>
                                            <Divider type={"vertical"}/>
                                            <span><ClockCircleOutlined/> {TimeDiff(item.gmtStart, item.gmtEnd)}</span>
                                            <Divider type={"vertical"}/>
                                            <span><TeamOutlined/> {item.participantNum}</span>
                                            <Divider type={"vertical"}/>
                                            {TimeRangeState(item.gmtStart, item.gmtEnd) === "end" && (
                                                <Tag color={"green"}>结束</Tag>
                                            )}
                                            {TimeRangeState(item.gmtStart, item.gmtEnd) === "running" && (
                                                <Tag color={"orange"}>进行中</Tag>
                                            )}
                                            {item.isPublic === 0 && (
                                                <Tag color={"red"}>私有</Tag>
                                            )}
                                        </Space>

                                    }
                                />
                            </List.Item>
                        )
                    }}
                    name={props.name ?? "ContestList"}
                />
            </div>
        </>
    )
}

export default withRouter(ContestList)