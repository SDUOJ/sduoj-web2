import React, {Component} from "react";
import {Role, Sex} from "../Type/Iuser";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {Button, Card, Space, Tag} from "antd";
import TableWithSelection from "../Component/common/Table/TableWithSelection";
import MApi from "../Utils/API/m-api";
import TableWithPagination from "../Component/common/Table/TableWithPagination";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";

class MProblem extends Component<any, any> {
    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "problemId",
                width: 50,
                responsive: ["lg", "sm"]
            },
            {
                title: "题号",
                dataIndex: "problemCode",
                width: "auto",
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: "标题",
                dataIndex: "problemTitle",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: "时间限制",
                dataIndex: "timeLimit",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return <>{Math.floor(parseInt(text) / 1000)}s ({text}ms)</>
                }
            },
            {
                title: "内存限制",
                dataIndex: "memoryLimit",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return <>{Math.floor(parseInt(text) / 1024)}MB ({text}KB)</>
                }
            },
            {
                title: "提交数据",
                width: "auto",
                responsive: ["lg"],
                render: (text: string, row: any) => {
                    return <>{row.acceptNum} / {row.submitNum}</>
                }
            },
            {
                title: "来源",
                dataIndex: "source",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: "作者",
                dataIndex: "username",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("operator"),
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <Button type={"link"} size={"small"}>{this.props.t("Edit")}</Button>
                            <Button type={"link"} size={"small"}>{this.props.t("Fork")}</Button>
                            <Button type={"link"} size={"small"}>{this.props.t("Description")}</Button>
                            <Button type={"link"} size={"small"}>{this.props.t("Checkpoint")}</Button>
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
                    title={"题目列表"}
                    extra={
                        <>
                            <Button>a</Button>
                        </>
                    }
                >
                    <TableWithPagination
                        columns={colData}
                        API={MApi.getProblemList}
                        size={"small"}
                    />
                </Card>
            </div>
        )
    }
}

export default withTranslation()(withRouter(MProblem))