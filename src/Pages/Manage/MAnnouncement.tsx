import React, {Component} from "react";
import {withRouter} from "react-router";
import {Card, Space, Tag} from "antd";
import {withTranslation} from "react-i18next";
import MApi from "../../Utils/API/m-api";
import {unix2Time} from "../../Utils/Time";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import TableRowDeleteButton from "../../Component/common/Table/TableRowDeleteButton";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import ItemTop from "../../Component/announcement/Form/Item/ItemTop";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import ItemTitle from "../../Component/common/Form/Item/ItemTitle";


class MAnnouncement extends Component<any, any> {


    render() {

    const Form = (
            <>
                <ItemTop/>
        <ItemTitle/>
    <ItemEditor label={this.props.t("AnnouncementContent")} name={"text"}/>
            </>
        )

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
                            <ModalFormUseForm
                                TableName={"Announcement"}
                                title={this.props.t("EditWithName", {name: rows.title})}
                                type={"update"}
                                width={1100}
                                subForm={[{component: Form}]}
                                initData={rows}
                                updateAppendProps={{noticeId: rows.noticeId, userId: rows.userId}}
                                dataSubmitter={(value: any) => {
                                    value.top = (value.top ? 1 : 0)
                                    return MApi.updateAnnouncement(value)
                                }}
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
                    bordered={true}
                    title={this.props.t("AnnouncementList")}
                    extra={
                        <>
                            <ModalFormUseForm
                                TableName={"Announcement"}
                                title={this.props.t("create")}
                                type={"create"}
                                width={1100}
                                subForm={[{component: Form}]}
                                dataSubmitter={(value: any) => {
                                    value.top = (value.top ? 1 : 0)
                                    return MApi.createAnnouncement(value)
                                }}
                            />
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

export default withTranslation()(
    withRouter(MAnnouncement)
)

