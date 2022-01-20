import React, {Component} from "react";
import {withRouter} from "react-router";
import {RouteComponentProps} from "react-router-dom";
import {IUserPropRoles, Role, Sex} from "../Type/Iuser";
import GroupListOperHead from "../Component/group/GroupListOperHead";
import GroupList from "../Component/group/GroupList";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {Button, Card, Space, Tag} from "antd";
import TableWithSelection from "../Component/common/TableWithSelection";
import MApi from "../Utils/API/m-api";
import {withTranslation} from "react-i18next";



class MGroup extends Component<any, any> {


    render() {

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "userId",
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: this.props.t("username"),
                dataIndex: "username",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: this.props.t("nickname"),
                dataIndex: "nickname",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("sex"),
                dataIndex: "gender",
                width: 50,
                responsive: ["lg"],
                render: (sex: Sex) => {
                    switch (sex) {
                        case Sex.Male:
                            return <ManOutlined/>
                        case Sex.Female:
                            return <WomanOutlined/>
                        case Sex.Unknown:
                            return <QuestionOutlined/>
                    }
                }
            },
            {
                title: this.props.t("student_id"),
                dataIndex: "studentId",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("sdu_id"),
                dataIndex: "sduId",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("email"),
                dataIndex: "email",
                width: "auto",
                responsive: ["lg", "sm"],
            },
            {
                title: this.props.t("roles"),
                width: "200px",
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            {
                                rows.roles !== null && rows.roles.map((value: Role) => {
                                    switch (value) {
                                        case "user":
                                            return <Tag>{this.props.t("user")}</Tag>
                                        case "admin":
                                            return <Tag color={"gold"}>{this.props.t("admin")}</Tag>
                                        case "superadmin":
                                            return <Tag color={"red"}>{this.props.t("superadmin")}</Tag>
                                    }
                                })
                            }
                        </Space>
                    )
                }
            },
            {
                title: this.props.t("operator"),
                width: "150px",
                render: (text: any, rows: any) => {
                    return <Button type={"link"}>{this.props.t("Edit")}</Button>
                }
            }
        ]

        return (
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card
                    bordered={false}
                    title={"题目列表"}
                    extra={
                        <>
                            <Button>a</Button>
                        </>
                    }
                >
                    <TableWithSelection
                        colData={colData}
                        API={MApi.getProblemList}
                        size={"small"}
                        rowKey={"userId"}
                    />
                </Card>
            </div>
        )
    }
}

export default withTranslation()(withRouter(MGroup))
