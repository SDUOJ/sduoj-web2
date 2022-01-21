import {Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {defaultPageSize} from "../../Config/constValue";
import {UserState} from "../../Type/Iuser";
import {ManageState} from "../../Type/IManage";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


const TableWithPagination = (props: any) => {

    const [total, setTotal] = useState<number>(0)
    const [tableData, setTableData] = useState()
    const [loading, setLoading] = useState(true)
    const [pageNow, setPageNow] = useState<number>(1)
    const [tableVersion, setTableVersion] = useState<number>(0)

    const getInfo = (pageNow: number, pageSize?: number) => {
        let ps = pageSize === undefined ? defaultPageSize : pageSize
        setPageNow(pageNow)
        setLoading(true)
        props.API({
            pageNow: pageNow,
            pageSize: ps,
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
        getInfo(pageNow, defaultPageSize)
    }, [])

    useEffect(() => {
        if (props.name !== undefined &&
            props.tableVersion[props.name] !== undefined &&
            tableVersion !== props.tableVersion[props.name]){
            setTableVersion(props.tableVersion[props.name])
            getInfo(pageNow, defaultPageSize)
        }
        console.log("change Table")
    }, [props.tableVersion, tableVersion])

    return (
        <Table
            rowKey={props.rowKey}
            loading={loading}
            size={props.size}
            columns={props.columns}
            rowSelection={props.rowSelection}
            dataSource={tableData}
            pagination={{
                onChange: getInfo,
                defaultPageSize: defaultPageSize,
                total: total,
                showQuickJumper: true,
                showLessItems: true,
            }}
        >
        </Table>
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

