import React, {Component} from "react";
import {withRouter} from "react-router";
import UserList from "../Component/user/UserList";
import UserListOperHeader from "../Component/user/UserListOperHeader";
import {IUserPropRoles, Role, Sex} from "../Type/Iuser";
import {RouteComponentProps} from "react-router-dom";
import MTable, {colType, extraFunction} from "../Component/common/MTable";
import {Tooltip} from "antd";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";


interface MUserState {
    UserListObj: any
    ids: number[]
}

class MUser extends Component<IUserPropRoles & RouteComponentProps, MUserState> {


    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
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

        const colData: colType[] = [
            {
                title: "#",
                dataIndex: "id",
                render: null,
                width: 50,
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: "username",
                dataIndex: "username",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
                render: (str: string) => {
                    return (
                        <Tooltip placement="topLeft" title={str}>
                            {str}
                        </Tooltip>
                    )
                }
            },
            {
                title: "nickname",
                dataIndex: "nickname",
                width: 100,
                responsive: ["lg", "sm"],
                render: (str: string) => {
                    return (
                        <Tooltip placement="topLeft" title={str}>
                            {str}
                        </Tooltip>
                    )
                }
            },
            {
                title: "sex",
                dataIndex: "sex",
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
                title: "student_id",
                dataIndex: "student_id",
                width: "auto",
                responsive: ["lg"],
                render: (str: string) => {
                    return (
                        <Tooltip placement="topLeft" title={str}>
                            {str}
                        </Tooltip>
                    )
                }
            },
            {
                title: "sdu_id",
                dataIndex: "sdu_id",
                width: "auto",
                responsive: ["lg"],
                render: (str: string) => {
                    return (
                        <Tooltip placement="topLeft" title={str}>
                            {str}
                        </Tooltip>
                    )
                }
            },
            {
                title: "email",
                dataIndex: "email",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (str: string) => {
                    return (
                        <Tooltip placement="topLeft" title={str}>
                            {str}
                        </Tooltip>
                    )
                }
            }
        ]
        const func: extraFunction[] = [
            {
                name: "Add",
                showRoles: [Role.Admin, Role.SuperAdmin],
                extraFunc: (id: number) => alert(111)
            },
            {
                name: "Delete",
                showRoles: [Role.SuperAdmin],
                extraFunc: (id: number) => alert(222)
            }
        ]

        return (
            <>
                <div style={{marginTop: -20, overflow: "hidden"}}>
                    <MTable id={1} roles={[Role.SuperAdmin]} colData={colData} func={func}/>

                    {/*<UserListOperHeader id={this.props.id} roles={this.props.roles} data={this.state.ids} obj={this.state.UserListObj}/>*/}
                    {/*<UserList id={this.props.id} roles={this.props.roles} obj={this.Ref}/>*/}
                </div>
            </>
        )
    }
}

export default withRouter(MUser)