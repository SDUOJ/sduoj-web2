import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {ManageState} from "../../../Type/IManage";
import React, {Dispatch, useEffect, useState} from "react";
import {Badge, Button, message, Popconfirm, Popover, Space} from "antd";
import ExportExcel from "../ExportExcel";
import MApi from "Utils/API/m-api"
import DeleteConfirm from "../DeleteConfirm";

const ButtonWithSelection = (props: any) => {

    const msgList: { [key: string]: any } = {
        delete: {
            popover: {
                content: props.t("chooseToDelete"),
                title: props.t("deleteBatch"),
            }
        },
        export: {
            popover: {
                content: props.t("chooseToExport"),
                title: props.t("exportBatch"),
            },
        }
    }

    const isSelected = () => {
        return props.selectedRowKeys.length !== 0
    }

    const [MouseIn, setMouseIn] = useState<boolean>(false)

    return (
        <>
            <Popover
                content={msgList[props.type].popover.content}
                title={msgList[props.type].popover.title}
                visible={!isSelected() && MouseIn}
            >
                <div
                    onMouseEnter={() => {
                        setMouseIn(true)
                        // disable 的属性的属性，无法执行 onMouseLeave 的回调
                        if(props.type === "export"){
                            setTimeout(()=>{
                                setMouseIn(false)
                            }, 3000)
                        }
                    }}
                    onMouseLeave={() => {
                        setMouseIn(false)
                    }}
                >
                    {
                        props.type === "export" && (
                            <ExportExcel
                                ButtonType={"default"}
                                ButtonText={props.ButtonText}
                                ButtonProps={{disabled: !isSelected()}}
                                fileName={props.fileName}
                                getJson={async () => {
                                    if (!isSelected()) return Promise.reject("未选中")
                                    let data: any = []
                                    for (const x of props.selectedRowKeys) {
                                        const eleId = props.dataSource.findIndex((item: any) => item[props.rowKey] === x)
                                        if (eleId !== -1) {
                                            let obj: any = {}
                                            for (const x in props.dataSource[eleId]) {
                                                obj[x] = String(props.dataSource[eleId][x]) === "[object Object]" ?
                                                    JSON.stringify(props.dataSource[eleId][x]) :
                                                    String(props.dataSource[eleId][x])
                                            }
                                            data.push(obj)
                                        }
                                    }
                                    return Promise.resolve(data)
                                }}
                            />
                        )
                    }
                    {
                        props.type === "delete" && (
                            <DeleteConfirm
                                onConfirm={() => {
                                    if (!isSelected()) {
                                        message.error("未选中")
                                        return
                                    }
                                    let data: any = []
                                    for (const x of props.selectedRowKeys) {
                                        const eleId = props.dataSource.findIndex((item: any) => item[props.rowKey] === x)
                                        if (eleId !== -1) {
                                            data.push(props.dataSource[eleId][props.deleteKey])
                                        }
                                    }
                                    MApi.deleteUsers(data).then((res) => {
                                        props.addTableVersion(props.tableName)
                                        props.setSelectedRowKeys([])
                                        message.success("删除成功")
                                    })
                                }}
                                content={
                                    <Button
                                        type={"primary"}
                                        danger={true}
                                        disabled={!isSelected()}
                                    >{props.ButtonText}</Button>
                                }
                            />
                        )
                    }
                </div>
            </Popover>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const MState: ManageState = state.ManageReducer
    return {
        selectedRowKeys: MState.tableData.selectedRowKeys,
        dataSource: MState.tableData.dataSource
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", data: name}),
    setSelectedRowKeys: (data: React.Key[]) =>
        dispatch({type: "setSelectedRowKeys", data: data}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ButtonWithSelection)
    ))