import React, {Component} from "react";
import {Button, Dropdown, Menu, PageHeader} from "antd";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {withTranslation} from "react-i18next";
import {EllipsisOutlined} from '@ant-design/icons';
import {RouteComponentProps, withRouter} from "react-router-dom";

const menu = (
    <Menu>
        <Menu.Item>
            <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
                1st menu item
            </a>
        </Menu.Item>
        <Menu.Item>
            <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
                2nd menu item
            </a>
        </Menu.Item>
        <Menu.Item>
            <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">
                3rd menu item
            </a>
        </Menu.Item>
    </Menu>
);

const DropdownMenu = () => (
    <Dropdown key="more" overlay={menu}>
        <Button style={{border: 'none', padding: 0,}}>
            <EllipsisOutlined style={{fontSize: 20, verticalAlign: 'top'}}/>
        </Button>
    </Dropdown>
);

class UserListOperHeader extends Component<IUserPropRoles & RouteComponentProps, any> {

    extra: any[] = []

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        this.extra = [];
        const roles = this.props.roles;
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(<Button key="1">{this.props.t("addUser")}</Button>)
        }
        if (roles.includes(Role.SuperAdmin)) {
            this.extra.push(<Button key="2" danger>{this.props.t("deleteUser")}</Button>)
        }
        if (roles.includes(Role.Admin) || roles.includes(Role.SuperAdmin)) {
            this.extra.push(
                <Button key="3"> {this.props.t("importUser")}</Button>,
                <Button key="4"> {this.props.t("exportUser")}</Button>,
                <DropdownMenu key="more"/>)
        }
    }

    render() {
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