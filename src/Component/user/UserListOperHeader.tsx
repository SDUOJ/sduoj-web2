import React, {Component} from "react";
import {Button, PageHeader} from "antd";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import BatchOperationUser from "./BatchOperationUser";
import Search from "antd/es/input/Search";


// 此处的 obj 传递的是表格的 this

class UserListOperHeader extends Component<IUserPropRoles & RouteComponentProps, any> {

    extra: any[] = []

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.extra = [];
    }

    render() {
        this.extra = [];
        if (this.props.obj === null) return <></>
        this.extra.push(
            <Search
                key={"search"}
                placeholder={this.props.t("searchUser")}
                onSearch={this.props.obj.onSearch}
                enterButton
                style={{width: 200}}
            />)

        const roles = this.props.roles;
        if (roles.includes("admin") || roles.includes("superadmin")) {
            this.extra.push(
                <Button key="btn-1">{this.props.t("addUser")}</Button>
            )
        }
        if (roles.includes("superadmin")) {
            this.extra.push(
                <BatchOperationUser key="btn-2" callback={this.props.obj.deleteUser}
                                    btSize={undefined} ids={this.props.data} type={"delete"}/>)
        }
        if (roles.includes("admin") || roles.includes("superadmin")) {
            this.extra.push(
                <Button key="btn-3"> {this.props.t("import")}</Button>,
                <BatchOperationUser callback={undefined}
                    btSize={undefined} ids={this.props.data} type={"export"}
                    key="btn-4"/>
            )
        }
        return (
            <PageHeader
                key={"PageHeader"}
                ghost={false}
                title={this.props.t("userList")}
                extra={this.extra}
            >
            </PageHeader>
        )
    }
}

export default withTranslation()(withRouter(UserListOperHeader))
