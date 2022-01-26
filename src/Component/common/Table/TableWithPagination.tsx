import {Card, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {defaultPageSize} from "../../../Config/constValue";
import {UserState} from "../../../Type/Iuser";
import {ManageState} from "../../../Type/IManage";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import Search from "antd/es/input/Search";


const TableWithPagination = (props: any) => {

    const [total, setTotal] = useState<number>(0)
    const [tableData, setTableDataX] = useState()
    const [loading, setLoading] = useState(true)
    const [PageNow, setPageNow] = useState<number>(1)
    const [PageSize, setPageSize] = useState<number>(defaultPageSize)
    const [searchText, setSearchText] = useState<string|undefined>()
    const [tableVersion, setTableVersion] = useState<number>(0)

    const setTableData = (data: any)=>{
        setTableDataX(data)
        if(props.setDataSource !== undefined) props.setDataSource(data)
    }

    const getInfo = (pageNow: number, pageSize?: number, searchKey? :string) => {
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
        if (props.name !== undefined &&
            props.tableVersion[props.name] !== undefined &&
            tableVersion !== props.tableVersion[props.name]){
            setTableVersion(props.tableVersion[props.name])
            getInfo(PageNow, PageSize)
        }
        console.log("change Table")
    }, [props.tableVersion, tableVersion])

    return (
        <Card
            bordered={false}
            size={"small"}
            extra={props.search !== undefined ? (
                <Search
                    key={"search"}
                    placeholder={props.t("searchUser")}
                    onSearch={(text)=>{
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
                    showQuickJumper: true,
                    showLessItems: true,
                }}
            />
        </Card>
    )

}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const MState: ManageState = state.ManageReducer
    return {
        roles: UState.userInfo?.roles,
        tableVersion: MState.tableData.tableVersion
    }

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setSelectedRowKeys: (data: React.Key[]) =>
        dispatch({type: "setSelectedRowKeys", value: data})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithPagination)
))

