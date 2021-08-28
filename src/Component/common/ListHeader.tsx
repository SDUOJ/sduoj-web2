import React, {Component} from "react";
import {Button, PageHeader} from "antd";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import DeleteTemplate from "./DeleteTemplate";
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
                <DeleteTemplate
                    key="btn-2"
                    callback={this.props.obj.delete}
                    btSize={undefined}
                    ids={this.props.data}>

                    {this.props.t("delete")}
                </DeleteTemplate>)
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
                    title={this.props.t("groupList")}
                    extra={this.extra}
                >
                </PageHeader>
            </>

        )
    }
}

export default withTranslation()(withRouter(UserListOperHeader))
