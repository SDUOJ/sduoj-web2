import React, {Component} from "react";
import {Button, Dropdown, Menu, PageHeader} from "antd";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {EllipsisOutlined} from '@ant-design/icons';
import {RouteComponentProps, withRouter} from "react-router-dom";
import DeleteUser from "./DeleteUser";
import Search from "antd/es/input/Search";


class UserListOperHeader extends Component<IUserPropRoles & RouteComponentProps, any> {

    extra: any[] = []

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.extra = [];
    }

    render() {
        this.extra = [];
        if(this.props.obj === null) return <></>
        this.extra.push(
            <Search
                placeholder={this.props.t("searchUser")}
                onSearch={this.props.obj.onSearch}
                enterButton
                style={{ width: 200 }}
            />)

        const roles = this.props.roles;
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(<Button key="btn-1">{this.props.t("addUser")}</Button>)
        }
        if (roles.includes(Role.SuperAdmin)) {
            this.extra.push(
                <DeleteUser
                    key="btn-2"
                    callback={this.props.obj.deleteUser}
                    btSize={undefined}
                    ids={this.props.data}>

                    {this.props.t("deleteUser")}
                </DeleteUser>)
        }
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(
                <Button key="btn-3"> {this.props.t("importUser")}</Button>,
                <Button key="btn-4"> {this.props.t("exportUser")}</Button>
            )
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

        )
    }
}

export default withTranslation()(withRouter(UserListOperHeader))