import React, {Component} from "react";

import {IUser, IUserPropRoles, Sex} from '../../Type/Iuser'
import {Button, Space, Table, TablePaginationConfig} from "antd";
import DeleteUser from "./DeleteUser";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {FilterValue, SorterResult, TableCurrentDataSource} from "antd/lib/table/interface";
import {ManOutlined, WomanOutlined, QuestionOutlined} from "@ant-design/icons"


interface IUserListState {
    userList: IUser[],
    loading: boolean,
    total: number
    showCol: object
}

interface IUserListCol{
    title_i18n: string
    dataIndex: string,
    render: any
}

const colData:IUserListCol[] = [
    {
        title_i18n: "#",
        dataIndex:"id",
        render: null
    },
    {
        title_i18n: "username",
        dataIndex:"username",
        render: null
    },
    {
        title_i18n: "nickname",
        dataIndex:"nickname",
        render: null
    },
    {
        title_i18n: "sex",
        dataIndex:"sex",
        render: (sex:Sex) =>{
            switch (sex){
                case Sex.Male:
                    return <ManOutlined />
                case Sex.Female:
                    return <WomanOutlined />
                case Sex.Unknown:
                    return <QuestionOutlined />
            }
        }
    },
    {
        title_i18n: "#",
        dataIndex:"id",
        render: null
    },
    {
        title_i18n: "#",
        dataIndex:"id",
        render: null
    },
]


class UserList extends Component<IUserPropRoles & RouteComponentProps, IUserListState> {

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        let userList: IUser[] = []
        for (let i = 1; i < 200; i++) {
            userList.push({
                id: i,
                username: i.toString(),
                nickname: i.toString(),
                roles: []
            })
        }
        this.state = {
            userList: userList,
            loading: false,
            total: 199,
            showCol: {}
        }
        this.showTotal = this.showTotal.bind(this)
    }

    deleteUser = (id: number) => {
        this.setState((state) => {
            return {userList: state.userList.filter(user => user.id !== id)}
        })
    }

    showTotal(total: number) {
        return this.props.t("total") + " " + total.toString() + " " + this.props.t("item")
    }

    tableChange(pagination: TablePaginationConfig,
                filters: Record<string, FilterValue | null>,
                sorter: SorterResult<IUser> | SorterResult<any>[],
                extra: TableCurrentDataSource<any>): void {


    }

    render() {
        return (
            <>
                <Table dataSource={this.state.userList}
                       rowKey='id'
                       loading={this.state.loading}
                       size={"small"}
                       onChange={this.tableChange}
                       pagination={{
                           size: "small", total: this.state.total,
                           showSizeChanger: true,
                           showQuickJumper: true,
                           showTotal: this.showTotal,
                       }}

                >
                    {

                        (
                            <Table.Column
                                title={"#"}
                                dataIndex={'id'}
                            />
                        )

                    }

                    <Table.Column
                        title={"Username"}
                        dataIndex={'username'}
                    />
                    <Table.Column
                        title={"Username"}
                        dataIndex={'username'}
                    />
                    <Table.Column
                        title={""}
                        render={(user: IUser) => (
                            <Space>
                                <Button type='primary'>编辑</Button>
                                <DeleteUser callback={this.deleteUser} id={user.id}/>
                            </Space>
                        )}/>
                </Table>
            </>
        )
    }
}

export default withTranslation()(withRouter(UserList))