import ListTemplate, {extraFunction} from "../Component/common/ListTemplate";
import {IUserPropRoles, Role, Sex} from "../Type/Iuser";
import {Breakpoint} from "antd/lib/_util/responsiveObserve";
import {Tooltip} from "antd";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import React, {Component} from "react";
import {RouteComponentProps} from "react-router-dom";
import {withRouter} from "react-router";
import ListHeader from "../Component/common/ListHeader";
import cApi from '../Utils/API/c-api'

interface listState {
    list: any
    ids: number[]
}

interface IUserListCol {
    title_i18n: string
    dataIndex: string,
    render: any
    width: number | string
    responsive: Breakpoint[]
}

const colData: IUserListCol[] = [
    {
        title_i18n: "#",
        dataIndex: "id",
        render: null,
        width: 50,
        responsive: ["lg", "sm", "xs"]
    },
    {
        title_i18n: "username",
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
        title_i18n: "nickname",
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
        title_i18n: "sex",
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
        title_i18n: "student_id",
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
        title_i18n: "sdu_id",
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
        title_i18n: "email",
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

const func : extraFunction[] = [
    {
        functionName: "Add",
        minRole: Role.User,
        extraFunc: (id: number) => alert(111)
    },
    {
        functionName: "Delete",
        minRole: Role.Admin
    }
]

class TestPage extends Component<IUserPropRoles & RouteComponentProps, listState> {
    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.state = {
            list: null,
            ids: []
        }
    }

    Ref = (ref: any, ids: number[]) => {
        this.setState((state) => {
            this.setState({ list: ref, ids: ids })
        })
    }

    render() {
        return (
            <>
                { cApi.getCopyright().then(res => console.log(res?.data)) }
                <div style={{marginTop: -20, overflow: "hidden"}}>
                    <ListHeader id={this.props.id} roles={this.props.roles} obj={this.state.list} data={this.state.ids} />
                    <ListTemplate id={this.props.id} roles={this.props.roles}
                    colData={colData} func={func} obj={this.Ref} />
                </div>
            </>
        )
    }
}

export default withRouter(TestPage)
