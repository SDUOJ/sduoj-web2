import cApi from "../../Utils/API/c-api";
import "../../Assert/css/ContestList.css";
import {Divider, Form, List, Select, Space, Tag} from "antd";
import moment from "moment";
import {ClockCircleOutlined, LockFilled, TeamOutlined} from "@ant-design/icons";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import React, {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import TableWithPagination from "../common/Table/TableWithPagination";
import {withTranslation} from "react-i18next";

const ContestList = (props: any) => {
    const [myGroup, setMyGroup] = useState<any>(undefined)

    useEffect(() => {
        cApi.getMyGroup().then((res: any) => {
            setMyGroup(res)
        })
    }, [])

    return (
        <>
            <div className={"ListPage ContestListWrap"}>
                <TableWithPagination
                    useList={true}
                    listCardBordered={true}
                    title={props.t("contestList")}
                    API={async (data: any) => {
                        return cApi.getContestList({...data, ...props.apiProp})
                    }}
                    size={"small"}
                    getForm={(onFinish: any) => {
                        return (
                            <Space size={30}>
                                {props.useGroup === undefined && myGroup !== undefined && (
                                    <Form.Item label={props.t("group")} name={"groupId"}>
                                        <Select onChange={onFinish} style={{width: 200}}
                                                defaultValue={""}>
                                            <Select.Option value={""}>{props.t("All")}</Select.Option>
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
                                <Form.Item label={props.t("contestRules")} name={"mode"}>
                                    <Select onChange={onFinish} style={{width: 80}}
                                            defaultValue={""}>
                                        <Select.Option value={""}>{props.t("All")}</Select.Option>
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
                                        <div>
                                            <div style={{textAlign: "center", fontSize: "30px"}}>
                                                {moment(parseInt(item.gmtStart)).format("DD")}
                                            </div>
                                            <div style={{color: "#aaa", fontSize: "12px", textAlign: "center"}}>
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
                                                <span className="ContestModeTag" style={{backgroundColor: "#3676b6"}}>ACM</span>
                                            )}
                                            {item.features.mode === "ioi" && (
                                                <span className="ContestModeTag" style={{backgroundColor: "#ea517f"}}>IOI</span>
                                            )}
                                            {item.features.mode === "oi" && (
                                                <span className="ContestModeTag" style={{backgroundColor: "#f8df72", color: '#222'}}>OI</span>
                                            )}
                                            <Divider type={"vertical"}/>
                                            <span>{moment(parseInt(item.gmtStart)).format("HH:mm:ss")}</span>
                                            <Divider type={"vertical"}/>
                                            <span><ClockCircleOutlined/> {TimeDiff(item.gmtStart, item.gmtEnd)}</span>
                                            <Divider type={"vertical"}/>
                                            <span><TeamOutlined/> {item.participantNum}</span>
                                            <Divider type={"vertical"}/>
                                            {TimeRangeState(item.gmtStart, item.gmtEnd) === "end" && (
                                                <Tag color={"green"}>{props.t("end")}</Tag>
                                            )}
                                            {TimeRangeState(item.gmtStart, item.gmtEnd) === "running" && (
                                                <Tag color={"orange"}>{props.t("running")}</Tag>
                                            )}
                                            {item.isPublic === 0 && (
                                                <Tag color={"red"}>{props.t("private")}</Tag>
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

export default withTranslation()(withRouter(ContestList))
