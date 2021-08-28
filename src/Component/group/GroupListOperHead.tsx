import React, {Component} from "react";
import {Button, PageHeader} from "antd";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import DeleteUser from "../user/DeleteUser";

class GroupListOperHead extends Component<IUserPropRoles & RouteComponentProps> {
    extra: any[] = []

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.extra = [];
    }

    render() {
        this.extra = [];
        const roles = this.props.roles;
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(<Button key="1">{this.props.t("addUser")}</Button>)
        }
        if (roles.includes(Role.SuperAdmin) && this.props.obj !== null) {
            this.extra.push(
                <DeleteUser
                    key="2"
                    callback={this.props.obj.deleteGroup}
                    btSize={undefined}
                    ids={this.props.data}
                >
                            {this.props.t("deleteUser")}
                </DeleteUser>
            )
        }
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(
                <Button key="3"> {this.props.t("importUser")}</Button>,
                <Button key="4"> {this.props.t("exportUser")}</Button>)
        }
        return (
            <>
                <PageHeader
                    ghost={false}
                    title={this.props.t("userList")}
                    extra={this.extra}
                 >
                </PageHeader>
            </>

    )}
}

export default withTranslation()(withRouter(GroupListOperHead))
