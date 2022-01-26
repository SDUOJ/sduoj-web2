import React, {Component} from "react";
import {LockOutlined} from "@ant-design/icons";
import {Button, Card, Space, Tag} from "antd";
import MApi from "../../Utils/API/m-api";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {unix2Time} from "../../Utils/Time";

class MContest extends Component<any, any> {
    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "contestId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("title"),
                dataIndex: "contestTitle",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
                render: (text: any, row: any) => {
                    return (
                        <span>
                            {text}
                            {row.features.openness === "private" && (<LockOutlined style={{color: "red"}}/>)}
                            {row.features.openness === "protected" && (<LockOutlined style={{color: "orange"}}/>)}
                            {row.isPublic === 0 && (<Tag color={"red"}>私有</Tag>)}
                        </span>
                    )
                }
            },
            {
                title: this.props.t("StartTime"),
                dataIndex: "gmtStart",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string)=>{
                    return unix2Time(parseInt(text))
                }
            },
            {
                title: this.props.t("Mode"),
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string, row: any)=>{
                    return <span>{row.features.mode}</span>
                }
            },
            {
                title: this.props.t("Participants"),
                dataIndex: "participantNum",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("ManageGroup"),
                dataIndex: "groupId",
                width: "auto",
                responsive: ["lg"],
                render: (text: string, row: any)=>{
                    return <span>{row.managerGroupDTO.groupId} ({row.managerGroupDTO.title})</span>
                }
            },
            {
                title: this.props.t("Owner"),
                dataIndex: "username",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("operator"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <Button type={"link"} size={"small"}>{this.props.t("Edit")}</Button>
                            <Button type={"link"} size={"small"}>{this.props.t("Fork")}</Button>
                        </Space>

                    )
                }
            }
        ]

        return (
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card
                    size={"small"}
                    bordered={false}
                    title={"比赛列表"}
                    extra={
                        <>
                            <Button>a</Button>
                        </>
                    }
                >
                    <TableWithPagination
                        columns={colData}
                        API={MApi.getContestList}
                        size={"small"}
                    />
                </Card>
            </div>
        )
    }
}

export default withTranslation()(withRouter(MContest))