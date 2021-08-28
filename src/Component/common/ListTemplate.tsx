import React, {Component} from "react";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {Breakpoint} from "antd/lib/_util/responsiveObserve";
import {RouteComponentProps} from "react-router-dom";
import {Button, Space, Table, TablePaginationConfig} from "antd";
import {FilterValue, SorterResult, TableCurrentDataSource} from "antd/lib/table/interface";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import judgeAuth from "../../Utils/judgeAhtu";
import DeleteTemplate from "./DeleteTemplate";

interface utilType {
    id : number,
    [key : string] : string | number
}

interface colType {
    title_i18n: string
    dataIndex: string,
    render: any
    width: number | string
    responsive: Breakpoint[]
}

interface tableState {
    list: utilType[],
    loading: boolean,
    total: number,
    showCol: object,
    selectedRowKeys: any
}

export type extraFunction = {
    functionName: string,
    minRole: Role,
    extraFunc?: (...params: any) => any
}

export interface listItemHeader {
    colData: colType[]
    func: extraFunction[]
}

type propType = IUserPropRoles & RouteComponentProps & listItemHeader

class ListTemplate extends Component<propType, tableState> {

    constructor(props: propType, context: any) {
        super(props, context);
        let List: utilType[] = []
        for (let i = 1; i < 200; i++) {
            List.push({
                id: i * 100,
                username: "yhf2000",
                nickname: "尹浩飞",
                sex: (i % 3),
                student_id: "201805130160",
                sdu_id: "201805130160",
                email: "735961159@qq.com"
            })
        }
        this.state = {
            list: List,
            loading: false,
            total: List.length,
            showCol: {},
            selectedRowKeys: []
        }
        this.showTotal = this.showTotal.bind(this)
    }

    delete = (ids: number[]) => {
        this.setState((state) => {
            return {
                list: state.list.filter(item => !ids.includes(item.id)),
                total: state.total - ids.length,
                selectedRowKeys: state.selectedRowKeys.filter((id: number) => !ids.includes(id))
            }
        })
    }

    showTotal(total: number) {
        return this.props.t("total") + " " + total.toString() + " " + this.props.t("item")
    }

    tableChange(pagination: TablePaginationConfig,
                filters: Record<string, FilterValue | null>,
                sorter: SorterResult<utilType> | SorterResult<any>[],
                extra: TableCurrentDataSource<any>): void {


    }

    componentDidMount() {
        this.props.obj && this.props.obj(this, this.state.selectedRowKeys)
    }

    shouldComponentUpdate(nextProps: Readonly<propType>, nextState: Readonly<tableState>, nextContext: any): boolean {
        if (nextState !== this.state) {
            this.props.obj && this.props.obj(this, nextState.selectedRowKeys)
            return true
        }
        return false
    }

    onSearch = (value: string) => {

    }

    render() {
        const {selectedRowKeys} = this.state
        let rowSelection: any = {
            selectedRowKeys,
            onChange: (selectedRowKeys: React.Key[]) => {
                this.setState({selectedRowKeys})
            },
            selections: [
                {
                    key: 'all',
                    text: this.props.t("selectedAll"),
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = changeableRowKeys
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key: number) => {
                            return !changeableRowKeys.includes(key);
                        }))
                        this.setState({selectedRowKeys: newSelectedRowKeys})
                    },
                },
                {
                    key: 'clear',
                    text: this.props.t("clear"),
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = this.state.selectedRowKeys.filter((key: number) => {
                            return !changeableRowKeys.includes(key);
                        })
                        this.setState({selectedRowKeys: newSelectedRowKeys});
                    },
                },
                {
                    key: 'invert',
                    text: this.props.t("invert"),
                    onSelect: (changeableRowKeys: number[]) => {
                        let newSelectedRowKeys = changeableRowKeys.filter((key) => {
                            return !this.state.selectedRowKeys.includes(key);
                        });
                        newSelectedRowKeys = newSelectedRowKeys.concat(this.state.selectedRowKeys.filter((key: number) => {
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
                <Table dataSource={this.state.list}
                       rowKey="id"
                       loading={this.state.loading}
                       size={"middle"}
                       onChange={this.tableChange}
                       pagination={{
                           size: "default", total: this.state.total,
                           showSizeChanger: true,
                           showQuickJumper: true,
                           showTotal: this.showTotal
                       }}
                       rowSelection={rowSelection}
                >
                    {
                        this.props.colData.map((r, i) => {
                            return (
                                <Table.Column
                                    key={"col" + i.toString()}
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
                        render={(item: utilType) => (
                            <Space>
                                {
                                    this.props.func.map((r, i) => {
                                        if (judgeAuth(this.props.roles, r.minRole)) {
                                            if (r.functionName === "Delete") {
                                                return <DeleteTemplate key={"del" + item.id.toString()} btSize={"small"} callback={this.delete}
                                                                       ids={[item.id]}/>
                                            }
                                            return <Button key={"btn-" + i} onClick={r.extraFunc} size={"small"}>{r.functionName}</Button>
                                        }
                                    })
                                }
                            </Space>
                        )}/>
                </Table>
            </>
        )
    }
}

export default withTranslation()(withRouter(ListTemplate))

