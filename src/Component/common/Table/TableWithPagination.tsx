import {Card, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {defaultPageSize} from "../../../Config/constValue";
import {UserState} from "../../../Type/Iuser";
import {ManageState} from "../../../Type/IManage";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import Search from "antd/es/input/Search";
import {TableState} from "../../../Type/ITable";


const TableWithPagination = (props: any) => {

    const [total, setTotal] = useState<number>(0)
    const [tableData, setTableDataX] = useState()
    const [loading, setLoading] = useState(true)
    const [PageNow, setPageNow] = useState<number>(1)
    const [PageSize, setPageSize] = useState<number>(defaultPageSize)
    const [searchText, setSearchText] = useState<string | undefined>()
    const [tableVersion, setTableVersion] = useState<number>(0)

    const setTableData = (data: any) => {
        setTableDataX(data)
        if (props.setDataSource !== undefined && props.name !== undefined)
            props.setDataSource(data, props.name)
    }

    const getInfo = (pageNow: number, pageSize?: number, searchKey?: string) => {
        let ps = pageSize === undefined ? PageSize : pageSize
        setPageNow(pageNow)
        setPageSize(ps)
        setLoading(true)
        props.API({
            pageNow: pageNow,
            pageSize: ps,
            searchKey: searchKey === undefined ? searchText : searchKey
        }).then((data: any) => {
            if (props.APIRowsTransForm !== undefined) {
                setTableData(data.rows.map((value: any) => {
                    return props.APIRowsTransForm(value)
                }))
            } else setTableData(data.rows)

            setTotal(ps * data.totalPage);
            setLoading(false)
        })
    }

    useEffect(() => {
        getInfo(PageNow, PageSize)
    }, [])

    useEffect(() => {
        const propsTableVersion = props.tableData[props.name]?.tableVersion
        if (propsTableVersion !== undefined && tableVersion !== propsTableVersion) {
            console.log(tableVersion, propsTableVersion)
            setTableVersion(propsTableVersion)
            getInfo(PageNow, PageSize)
        }
    }, [props.tableData, tableVersion])

    return (
        <Card
            bordered={false}
            size={"small"}
            extra={props.search !== undefined ? (
                <Search
                    key={"search"}
                    placeholder={props.t("searchUser")}
                    onSearch={(text) => {
                        setSearchText(text)
                        setPageNow(1)
                        getInfo(1, PageSize, text)
                    }}
                    enterButton
                    style={{width: 300}}
                />
            ) : undefined}
        >
            <Table
                rowKey={props.rowKey}
                loading={loading}
                size={props.size}
                columns={props.columns}
                rowSelection={props.rowSelection}
                dataSource={tableData}
                pagination={{
                    onChange: getInfo,
                    current: PageNow,
                    defaultPageSize: defaultPageSize,
                    total: total,
                    hideOnSinglePage: true,
                    showQuickJumper: true,
                    showLessItems: true,
                    showSizeChanger: true,
                    pageSizeOptions: ["5", "15", "20", "50", "80", "110"],
                }}
            />
        </Card>
    )

}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const TState: TableState = state.TableReduce
    return {
        roles: UState.userInfo?.roles,
        tableData: {...TState.tableData}
    }

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithPagination)
))

