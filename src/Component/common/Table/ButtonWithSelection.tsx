import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import React, {Dispatch, useState} from "react";
import {Button, message, Popover} from "antd";
import ExportExcel from "../ExportExcel";
import DeleteConfirm from "../DeleteConfirm";
import {TableState} from "../../../Type/ITable";
import {ck} from "../../../Utils/empty";

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

    const selectedRowKeys = ck(props.tableData[props.tableName]?.selectedRowKeys, [])
    const dataSource = ck(props.tableData[props.tableName]?.dataSource, [])

    const isSelected = () => {
        return selectedRowKeys.length !== 0
    }

    const [MouseIn, setMouseIn] = useState<boolean>(false)

    return (
        <>
            <Popover
                content={msgList[props.type].popover.content}
                title={msgList[props.type].popover.title}
                // visible={!isSelected() && MouseIn}
                visible={false}
            >
                <div
                    onMouseEnter={() => {
                        setMouseIn(true)
                        // disable 的属性的属性，无法执行 onMouseLeave 的回调
                        if (props.type === "export") {
                            setTimeout(() => {
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
                                // ButtonProps={{disabled: !isSelected()}}
                                fileName={props.fileName}
                                getJson={async () => {
                                    if (!isSelected()) return Promise.reject("未选中")
                                    let data: any = []
                                    for (const x of selectedRowKeys) {
                                        const eleId = dataSource.findIndex((item: any) => item[props.rowKey] === x)
                                        if (eleId !== -1) {
                                            let obj: any = {}
                                            for (const x in dataSource[eleId]) {
                                                obj[x] = String(dataSource[eleId][x]) === "[object Object]" ?
                                                    JSON.stringify(dataSource[eleId][x]) :
                                                    String(dataSource[eleId][x])
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
                                    for (const x of selectedRowKeys) {
                                        const eleId = dataSource.findIndex((item: any) => item[props.rowKey] === x)
                                        if (eleId !== -1) {
                                            data.push(dataSource[eleId][props.deleteKey])
                                        }
                                    }
                                    if (props.delAPI !== undefined) {
                                        props.delAPI(data).then((res: any) => {
                                            props.addTableVersion(props.tableName)
                                            props.setSelectedRowKeys([], props.tableName)
                                            message.success("删除成功")
                                        })
                                    } else {
                                        props.setDataSource(props.tableName, dataSource.filter((it: any) => selectedRowKeys.indexOf(it[props.rowKey]) === -1))
                                        props.setSelectedRowKeys([], props.tableName)
                                    }
                                }}
                                content={
                                    <Button
                                        type={"primary"}
                                        danger={true}
                                        // disabled={!isSelected()}
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
    const TState: TableState = state.TableReduce
    return {
        tableData: TState.tableData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
    setSelectedRowKeys: (data: React.Key[], name: string) =>
        dispatch({type: "setSelectedRowKeys", data: data, name: name}),
    setDataSource: (name: string, data: any) => dispatch({type: "setDataSource", name: name, data: data, add: true})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ButtonWithSelection)
    ))