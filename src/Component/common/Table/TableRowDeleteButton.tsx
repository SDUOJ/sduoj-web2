import React, {Dispatch} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Button, Popconfirm} from "antd";
import {DeleteOutlined} from "@ant-design/icons"
import {TableState} from "../../../Type/ITable";
import {ck} from "../../../Utils/empty";

const TableRowDeleteButton = (props: any) => {

    const selectedRowKeys = ck(props.tableData[props.tableName]?.selectedRowKeys, [])
    const dataSource = ck(props.tableData[props.tableName]?.dataSource, [])

    const wk = () => {
        if (props.API !== undefined) {
            props.API(props.data).then((value: any) => {
                props.addTableVersion(props.name)
            })
        } else {
            props.setDataSource(props.tableName, dataSource.filter((it: any) => props.data !== it[props.rowKey]))
            props.setSelectedRowKeys(selectedRowKeys.filter((it: any) => it !== props.data), props.tableName)
        }
    }

    let Props: any = {}

    if (props.type === "inline") {
        Props = {
            type: "link",
            size: "small"
        }
    } else {
        Props = {
            type: "primary",
            danger: true,
            icon: <DeleteOutlined/>,
        }
    }

    return (
        <Popconfirm
            title={props.t("deleteConfirm")}
            onConfirm={wk}
            okText={props.t("yes")}
            cancelText={props.t("no")}
        >
            <Button {...Props} {...props.btnProps}> {props.btnText ?? props.t("delete")} </Button>
        </Popconfirm>
    )
}

const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    return {
        tableData: TState.tableData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
    setDataSource: (name: string, data: any) => dispatch({type: "setDataSource", name: name, data: data, add: true}),
    setSelectedRowKeys: (data: React.Key[], name: string) =>
        dispatch({type: "setSelectedRowKeys", data: data, name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(TableRowDeleteButton)
    ))