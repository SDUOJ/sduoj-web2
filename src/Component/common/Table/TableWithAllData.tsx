import {Button, Card, Form, Space, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {defaultPageSize} from "../../../Config/constValue";
import {UserState} from "../../../Type/Iuser";
import {ManageState} from "../../../Type/IManage";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import Search from "antd/es/input/Search";
import {TableState} from "../../../Type/ITable";
import {ck} from "../../../Utils/empty";
import {SizeType} from "antd/lib/config-provider/SizeContext";
import {ColumnsType} from "antd/lib/table/interface";
import {useForm} from "antd/es/form/Form";

export interface TableWithPaginationProps {
    API: any                  // 表格查询数据的接口
    size: SizeType            // 表格的大小
    columns: ColumnsType<any> // 表格的列
    name: string              // 表格名称
    APIRowsTransForm?: any    // 针对API传输的数据进行转化的函数

    // 面向 可选择的行 开放的接口
    rowKey?: any              // 作为 key 记录的值

}

const TableWithAllData = (props: any) => {
    const [tableData, setTableDataX] = useState()                            // 表格核心数据
    const [loading, setLoading] = useState(true)                    // 表格的加载状态
    const [tableVersion, setTableVersion] = useState<number>(0)     // 表格版本（控制表格刷新）

    const setTableData = (data: any) => {
        setTableDataX(data)
        // 若有 选中行 的相关配置，传递数据进行更新
        if (props.setDataSource !== undefined && props.name !== undefined)
            props.setDataSource(data, props.name)
    }

    const getInfo = () => {
        setLoading(true)
        props.API().then((data: any) => {
            // console.log("data", data)
            if (data === null) data = []
            if (props.APIRowsTransForm !== undefined) {
                setTableData(props.APIRowsTransForm(data))
            } else setTableData(data)
            setLoading(false)
        })
    }

    useEffect(() => {
        getInfo()
    }, [props.name])


    useEffect(() => {
        // 监听表格的版本变化，当版本变更时更新表格
        const propsTableVersion = props.tableData[props.name]?.tableVersion
        if (propsTableVersion !== undefined && tableVersion !== propsTableVersion) {
            // 如果数据被外部应用更新，则用 redux 中的数据更新当前行
            if (propsTableVersion < 0) {
                setTableVersion(-propsTableVersion)
                setTableDataX(props.tableData[props.name]?.dataSource)
            } else {
                // 否则，重新进行请求
                setTableVersion(propsTableVersion)
                getInfo()
            }
        }
    }, [props.tableData, tableVersion])

    return (
        <Table
            rowKey={props.rowKey}
            loading={loading}
            size={props.size}
            columns={props.columns}
            dataSource={tableData}
            pagination={false}
        />
    )

}

const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    return {
        tableData: {...TState.tableData}
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setTableInfo: (name: string, data: any) => dispatch({
        type: "setTableInfo",
        name: name,
        data: data
    }),
    setDataSource: (data: any, name: string) =>
        dispatch({type: "setDataSource", data: data, name: name, add: false})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(TableWithAllData)
))

