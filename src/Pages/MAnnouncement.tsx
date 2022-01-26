import React, {Component, Dispatch} from "react";
import {withRouter} from "react-router";
import {Role, Sex} from "../Type/Iuser";
import TableWithSelection from "../Component/common/Table/TableWithSelection";
import {Button, Card, Space, Tag} from "antd";
import {ManOutlined, PlusOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {withTranslation} from "react-i18next";
import MApi from "../Utils/API/m-api";
import {unix2Time} from "../Utils/Time";
import TableWithPagination from "../Component/common/Table/TableWithPagination";
import AnnouncementForm from "../Component/announcement/AnnouncementForm";
import {ManageState} from "../Type/IManage";
import {connect} from "react-redux";
import TableRowDeleteButton from "../Component/common/Table/TableRowDeleteButton";


class MAnnouncement extends Component<any, any> {


    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "noticeId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("title"),
                dataIndex: "title",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
                render: (text: any, row: any) => {
                    return (
                        <Space size={5}>
                            {text}
                            {row.top === 1 && (<Tag color={"red"}>{this.props.t("Top")}</Tag>)}
                        </Space>
                    )
                }
            },
            {
                title: this.props.t("CreateTime"),
                dataIndex: "gmtCreate",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return unix2Time(parseInt(text))
                }
            },
            {
                title: this.props.t("ModifiedTime"),
                dataIndex: "gmtModified",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return unix2Time(parseInt(text))
                }
            },
            {
                title: this.props.t("Owner"),
                width: "auto",
                responsive: ["lg"],
                render: (text: any, row: any) => {
                    return row.username
                }
            },
            {
                title: this.props.t("operator"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <AnnouncementForm button={<Button type={"link"} size={"small"}>{this.props.t("Edit")}</Button>}
                                              title={"修改(" + rows.title + ")"}
                                              row={rows}
                            />
                            <TableRowDeleteButton
                                type={"inline"}
                                API={MApi.deleteAnnouncement}
                                data={{id: rows.noticeId}}
                                name={"Announcement"}/>
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
                    title={"公告列表"}
                    extra={
                        <>
                            <AnnouncementForm
                                type={"create"}
                                button={<Button icon={<PlusOutlined/>} type={"primary"}> 新建 </Button>}
                                title={"新建"}/>

                        </>
                    }
                >
                    <TableWithPagination
                        name={"Announcement"}
                        columns={colData}
                        API={MApi.getAnnouncementList}
                        size={"small"}
                    />
                </Card>
            </div>
        )
    }
}

export default
    withTranslation()(
        withRouter(MAnnouncement)
    )

