import React, {Component} from "react";

import {IUser, IUserPropRoles, Role, Sex} from '../../Type/Iuser'
import {Button, Space, Table, TablePaginationConfig} from "antd";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {FilterValue, SorterResult, TableCurrentDataSource} from "antd/lib/table/interface";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons"
import DeleteUser from "./DeleteUser";


interface IUserListState {
    userList: IUser[]
    loading: boolean
    total: number
    showCol: object
    selectedRowKeys: any[]
}

interface IUserListCol {
    title_i18n: string
    dataIndex: string,
    render: any
}

const colData: IUserListCol[] = [
    {
        title_i18n: "#",
        dataIndex: "id",
        render: null
    },
    {
        title_i18n: "username",
        dataIndex: "username",
        render: null
    },
    {
        title_i18n: "nickname",
        dataIndex: "nickname",
        render: null
    },
    {
        title_i18n: "sex",
        dataIndex: "sex",
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
        title_i18n: "operator",
        dataIndex: "id",
        render: null
    },
    {
        title_i18n: "#",
        dataIndex: "id",
        render: null
    },
]


class UserList extends Component<IUserPropRoles & RouteComponentProps, IUserListState> {

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        let userList: IUser[] = []
        for (let i = 1; i < 200; i++) {
            userList.push({
                id: (i * 2),
                username: i.toString(),
                nickname: i.toString(),
                sex: (i % 3),
                roles: []
            })
        }
        this.state = {
            userList: userList,
            loading: false,
            total: 199,
            showCol: {},
            selectedRowKeys: []
        }
        this.showTotal = this.showTotal.bind(this)
    }

    deleteUser = (ids: number[]) => {
        this.setState((state) => {
            console.log(ids)
            console.log(state.userList.filter(user => !ids.includes(user.id)))
            return {
                userList: state.userList.filter(user => !ids.includes(user.id)),
                total: state.total - ids.length
            }
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

    componentDidMount() {
        this.props.obj && this.props.obj(this)
    }

    render() {
        const {selectedRowKeys} = this.state;
        let rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[], selectedRows: IUser[]) => {
                console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                this.setState({selectedRowKeys});
            },
            selections: [
                {
                    key: 'all',
                    text: this.props.t("selectedAll"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = [];
                        newSelectedRowKeys = changeableRowKeys
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key, index) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = [];
                        newSelectedRowKeys = this.state.selectedRowKeys.filter((key, index) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },
                {
                    key: 'invert',
                    text: this.props.t("invert"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = [];
                        newSelectedRowKeys = changeableRowKeys.filter((key, index) => {
                            return !this.state.selectedRowKeys.includes(key);
                        });
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key, index) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },

            ]
        };
        if (!this.props.roles.includes(Role.SuperAdmin)) {
            rowSelection = undefined
        }

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
                       rowSelection={rowSelection}

                >
                    {
                        colData.map((r, i) => {
                            return (
                                <Table.Column
                                    title={this.props.t(r.title_i18n)}
                                    dataIndex={r.dataIndex}
                                    render={r.render}
                                />
                            )
                        })
                    }

                    <Table.Column
                        title={this.props.t("operator")}
                        render={(user: IUser) => (
                            <Space>
                                <Button type='primary'>编辑</Button>
                                {
                                    [''].map(() => {
                                        if (this.props.roles.includes(Role.SuperAdmin))
                                            return <DeleteUser callback={this.deleteUser} ids={[user.id]}/>
                                    })
                                }
                            </Space>
                        )}/>
                </Table>
            </>
        )
    }
}

export default withTranslation()(withRouter(UserList))