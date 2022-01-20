import React, {Component} from "react";
import {withRouter} from "react-router";
import UserList from "../Component/user/UserList";
import UserListOperHeader from "../Component/user/UserListOperHeader";
import {IUserPropRoles, Role, Sex} from "../Type/Iuser";
import {RouteComponentProps} from "react-router-dom";
import MTable from "../Component/common/TableWithSelection";
import {Button, Space, Tag, Tooltip} from "antd";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import {withTranslation} from "react-i18next";


interface MUserState {
    UserListObj: any
    ids: number[]
}

class MUser extends Component<any, MUserState> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            UserListObj: null,
            ids: []
        }
    }

    Ref = (ref: any, ids: number[]) => {
        this.setState((state) => {
            return {UserListObj: ref, ids: ids}
        })
    }


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
                                rows.roles !== null && rows.roles.map((value: Role)=>{
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
            <>
                <div style={{marginTop: -20, overflow: "hidden"}}>
                    <MTable colData={colData}/>
                </div>
            </>
        )
    }
}

export default withTranslation()(withRouter(MUser))
