import React, {Component} from "react";

import {IUserPropRoles, Role} from '../../Type/Iuser'
import {IGroup} from "../../Type/Igroup";
import {Button, Space, Table, TablePaginationConfig, Tooltip} from "antd";
import {withTranslation} from "react-i18next";
import {RouteComponentProps, withRouter} from "react-router-dom";
import {FilterValue, SorterResult, TableCurrentDataSource} from "antd/lib/table/interface";
import DeleteGroup from "./DeleteGroup";
import {Breakpoint} from "antd/lib/_util/responsiveObserve";


interface IGroupListState {
    groupList: IGroup[]
    loading: boolean
    total: number
    showCol: object
    selectedRowKeys: any[]
}

interface IGroupListCol {
    title_i18n: string
    dataIndex: string,
    render: any
    width: number | string
    responsive: Breakpoint[]
}

const colData: IGroupListCol[] = [
    {
        title_i18n: "#",
        dataIndex: "id",
        render: null,
        width: 50,
        responsive: ["lg", "sm", "xs"]
    },
    {
        title_i18n: "groupname",
        dataIndex: "title",
        render: (str: string) => {
            return (
                <Tooltip placement="topLeft" title={str}>
                    {str}
                </Tooltip>
            )
        },
        width: "auto",
        responsive: ["lg", "sm", "xs"],
    },
    {
        title_i18n: "createtime",
        dataIndex: "createTime",
        width: "auto",
        render: (str: string) => {
            return (
                <Tooltip placement="topLeft" title={str}>
                    {str}
                </Tooltip>
            )
        },
        responsive: ["lg", "sm", "xs"]
    },
    {
        title_i18n: "owner",
        dataIndex: "owner",
        width: "auto",
        render: (str: string) => {
            return (
                <Tooltip placement="topLeft" title={str}>
                    {str}
                </Tooltip>
            )
        },
        responsive: ["lg", "sm", "xs"]
    },
    {
        title_i18n: "openness",
        dataIndex: "openness",
        width: "auto",
        render: (num: number) => {
            return (
                <Tooltip placement="topLeft" title={num}>
                    {num}
                </Tooltip>
            )
        },
        responsive: ["lg", "sm", "xs"]
    },
    {
        title_i18n: "members",
        dataIndex: "members",
        width: "auto",
        render: (num: number) => {
            return (
                <Tooltip placement="topLeft" title={num}>
                    {num}
                </Tooltip>
            )
        },
        responsive: ["lg", "sm", "xs"]
    }
]


class GroupList extends Component<IUserPropRoles & RouteComponentProps, IGroupListState> {

    constructor(props: IUserPropRoles & RouteComponentProps, context: any) {
        super(props, context);
        let groupList: IGroup[] = []
        for (let i = 1; i < 200; i++) {
            groupList.push({
                id: i*100,
                createTime: "2021-10-27",
                description: "hahaha",
                members: i,
                openness: i,
                owner: "Superadmin",
                title: "计科" + i % 5
            })
        }
        this.state = {
            groupList: groupList,
            loading: false,
            total: 199,
            showCol: {},
            selectedRowKeys: []
        }
        this.showTotal = this.showTotal.bind(this)
    }

    deleteGroup = (ids: number[]) => {
        this.setState((state) => {
            return {
                groupList: state.groupList.filter(group => !ids.includes(group.id)),
                total: state.total - ids.length,
                selectedRowKeys: state.selectedRowKeys.filter(id => !ids.includes(id))
            }
        })

    }

    showTotal(total: number) {
        return this.props.t("total") + " " + total.toString() + " " + this.props.t("item")
    }

    tableChange(pagination: TablePaginationConfig,
                filters: Record<string, FilterValue | null>,
                sorter: SorterResult<IGroup> | SorterResult<any>[],
                extra: TableCurrentDataSource<any>): void {


    }

    componentDidMount() {
        this.props.obj && this.props.obj(this, this.state.selectedRowKeys)
    }

    shouldComponentUpdate(nextProps: Readonly<IUserPropRoles & RouteComponentProps>, nextState: Readonly<IGroupListState>, nextContext: any): boolean {
        if (nextState !== this.state) {
            this.props.obj && this.props.obj(this, nextState.selectedRowKeys)
            return true
        }
        return false
    }

    render() {
        const {selectedRowKeys} = this.state;
        let rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[], selectedRows: IGroup[]) => {
                console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                this.setState({selectedRowKeys});
            },
            selections: [
                {
                    key: 'all',
                    text: this.props.t("selectedAll"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = changeableRowKeys
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = this.state.selectedRowKeys.filter((key) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },
                {
                    key: 'invert',
                    text: this.props.t("invert"),
                    onSelect: (changeableRowKeys: any[]) => {
                        let newSelectedRowKeys = changeableRowKeys.filter((key) => {
                            return !this.state.selectedRowKeys.includes(key);
                        });
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },

            ]
        };
        if (!this.props.roles.includes("superadmin")) {
            rowSelection = undefined
        }

        return (
            <>
                <Table dataSource={this.state.groupList}
                       rowKey='id'
                       loading={this.state.loading}
                       size={"middle"}
                       onChange={this.tableChange}
                       pagination={{
                           size: "default", total: this.state.total,
                           showSizeChanger: true,
                           showQuickJumper: true,
                           showTotal: this.showTotal,
                       }}
                       rowSelection={rowSelection}

                >
                    {
                        colData.map((r) => {
                            return (
                                <Table.Column
                                    title={this.props.t(r.title_i18n)}
                                    width={r.width}
                                    align={"center"}
                                    responsive={r.responsive}
                                    dataIndex={r.dataIndex}
                                    ellipsis={{showTitle: false}}
                                    render={r.render}
                                />
                            )
                        })
                    }

                    <Table.Column
                        title={this.props.t("operator")}
                        width={120}
                        align={"center"}
                        render={(group: IGroup) => (
                            <Space>
                                <Button size={"small"} type='primary'>编辑</Button>
                                {
                                    function(roles: Role[], config) {
                                        if (roles.includes("superadmin"))
                                            return <DeleteGroup btSize={"small"} callback={config} ids={[group.id]}/>
                                        return <></>
                                    }(this.props.roles, this.deleteGroup)
                                }
                            </Space>
                        )}/>
                </Table>
            </>
        )
    }
}

export default withTranslation()(withRouter(GroupList))
