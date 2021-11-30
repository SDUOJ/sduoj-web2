import React, {Component, Dispatch} from "react";
import {IUserPropRoles, Role} from "../../Type/Iuser";
import {Breakpoint} from "antd/lib/_util/responsiveObserve";
import {RouteComponentProps} from "react-router-dom";
import {Button, Space, Table, TablePaginationConfig} from "antd";
import {FilterValue, SorterResult, TableCurrentDataSource} from "antd/lib/table/interface";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import judgeAuth from "../../Utils/judgeAhtu";
import DeleteTemplate from "../common/DeleteTemplate";
import {connect} from "react-redux";

interface dataType {
    id: number,
    [key: string]: string | number
}

export interface colType {
    title: string
    dataIndex: string,
    render: any
    width: number | string
    responsive: Breakpoint[]  // 按照屏幕大小决定是否显示
}

interface tableState {
    list: dataType[],
    loading: boolean,
    total: number,
    showCol: object,
    selectedRowKeys: any
}

export type extraFunction = {
    name: string,
    showRoles: Role[],
    extraFunc?: (...params: any) => any
}

export interface listItemHeader {
    colData: colType[]
    func?: extraFunction[]
}

type propType = IUserPropRoles & RouteComponentProps & listItemHeader

class MTable extends Component<propType, tableState> {

    constructor(props: propType, context: any) {
        super(props, context);
        let List: dataType[] = []
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
                sorter: SorterResult<dataType> | SorterResult<any>[],
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
            // 多选时的下拉选项
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
        if (!this.props.roles.includes("superadmin")) {
            rowSelection = undefined
        }

        return (
            <>
                <Table
                    dataSource={this.state.list}
                    loading={this.state.loading}
                    onChange={this.tableChange}
                    rowKey="id"
                    size={"middle"}
                    // 行多选
                    rowSelection={rowSelection}
                    // 分页器设计
                    pagination={{
                        size: "default",
                        total: this.state.total,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: this.showTotal
                    }}
                >
                    {/*表格内容*/}
                    {
                        this.props.colData.map((r, i) => {
                            return (
                                <Table.Column
                                    key={"col" + i.toString()}
                                    title={this.props.t(r.title)}
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
                    {
                        [''].map(() => {

                        })
                    }
                    <Table.Column
                        render={(item: dataType) => (
                            <Space>
                                {
                                    [''].map(() => {
                                        if (this.props.func != undefined)
                                            this.props.func.map((r, i) => {
                                                if (judgeAuth(this.props.roles, r.showRoles)) {
                                                    if (r.name === "Delete") {
                                                        return <DeleteTemplate key={"del" + item.id.toString()}
                                                                               btSize={"small"} callback={this.delete}
                                                                               ids={[item.id]}/>
                                                    } else {
                                                        return <Button key={"btn-" + i} onClick={r.extraFunc}
                                                                       size={"small"}>{r.name}</Button>
                                                    }
                                                }
                                            })
                                    })
                                }
                            </Space>
                        )}/>
                </Table>
            </>
        )
    }
}

const mapStateToProps = (state: number): {value: number} => ({
    value: state
})

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    // onadd: () => dispatch(add()),
    // onlesen: () => dispatch(lessen())
})

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(withRouter(MTable)))

