import {Button, Form, Input, message, Modal, Select, Space, Tabs, Tag} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import mApi from "Utils/API/m-api"
import {connect} from "react-redux";
import {TableState} from "../../Type/ITable";
import ItemTitle from "../common/Form/Item/ItemTitle";
import ItemSwitch from "../common/Form/Item/ItemSwitch";
import ItemEditor from "../common/Form/Item/ItemEditor";
import TableRowDeleteButton from "../common/Table/TableRowDeleteButton";
import {withTranslation} from "react-i18next";
import {unix2Time} from "../../Utils/Time";
import TextEllipsis from "../common/TextEllipsis";
import TableWithSelection from "../common/Table/TableWithSelection";
import {useForm} from "antd/lib/form/Form";
import {isValueEmpty} from "../../Utils/empty";
import {DownloadOutlined, MinusOutlined, PlusOutlined} from "@ant-design/icons";
import ButtonWithSelection from "../common/Table/ButtonWithSelection";
import TableWithAllData from "../common/Table/TableWithAllData";
import {NEWLINE_CONVERT, NEWLINE_CONVERT_INDEX} from "../../Config/constValue";
import ItemPassword from "../user/Form/Item/ItemPassword";
import ModalFormUseForm from "../common/Form/ModalFormUseForm";
import FormCheckPointsUpload from "./From/FormCheckPointsUpload";
import Title from "antd/es/typography/Title";
import {modifyProblemsCheckPoint} from "../../Type/types";

function DeleteOutlined() {
    return null;
}

const ProCheckPoints = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)
    const [sumScore, setSumScore] = useState<number>(0)
    const name = `ProCheckPoints-${props.problemCode}`

    const [form] = useForm();

    // 维护当前总分
    useEffect(() => {
        const data = props.tableData[name]?.dataSource;
        if (data !== undefined) {
            let formData: any = {}, score = 0
            let ckData: any = {}
            for (let x of data) {
                formData[x.checkpointId] = x.checkpointScore
                ckData[x.checkpointId] = x.caseIndex
                score += x.checkpointScore
            }
            form.setFieldsValue(formData)
            setSumScore(score)
        }
    }, [props.tableData])

    // 维护当前表格数据
    const [dataSource, setDatasource] = useState(props.tableData[name]?.dataSource)

    // 处理删除与批量删除后的 Case 信息
    const updateCaseInfo = () => {
        if (dataSource === undefined) return;
        let caseLeft: any = []
        let caseIndexMax = 0
        dataSource.forEach((x: any) => {
            if (x.caseIndex !== null) {
                caseLeft.push(x.caseIndex)
                caseIndexMax = Math.max(caseIndexMax, x.caseIndex)
            }
        })
        if (caseLeft.length === caseIndexMax) return
        caseLeft.sort()
        let changeMap: any = {}
        let cnt = 0
        for (let x of caseLeft) changeMap[x] = ++cnt;
        let newDataSource: any = []
        for (let x of dataSource) {
            if (x.caseIndex !== null) {
                newDataSource.push({...x, caseIndex: changeMap[x.caseIndex]})
            } else newDataSource.push(x)
        }
        props.setDataSource(newDataSource, name)
    }

    useEffect(updateCaseInfo, [dataSource])

    useEffect(() => {
        if (props.tableData[name]?.dataSource && JSON.stringify(dataSource) !== JSON.stringify(props.tableData[name]?.dataSource)) {
            setDatasource(props.tableData[name]?.dataSource)
        }
    }, [props.tableData, props.tableData[name]])

    const selectedRowKeys = props.tableData[name]?.selectedRowKeys ?? []

    // 不改变 Case 的相对值
    const setCase = (ckId: string) => {
        let newDataSource: any = []
        // 获取到当前 新增的 Case 应该写入的编号
        let caseId = 0
        dataSource.forEach((x: any) => {
            if (x.caseIndex !== null) caseId = Math.max(caseId, x.caseIndex)
        })
        // 更新数据
        for (let x of dataSource) {
            if (x.checkpointId === ckId) {
                newDataSource.push({...x, caseIndex: caseId + 1})
            } else newDataSource.push(x)
        }
        props.setDataSource(newDataSource, name)
    }

    // 找到要删除的 CaseId，后续的 Case 前移
    const removeCase = (ckId: string) => {
        let newDataSource: any = []
        let caseId = 0
        dataSource.forEach((x: any) => {
            if (x.checkpointId === ckId) caseId = x.caseIndex
        })
        for (let x of dataSource) {
            if (x.caseIndex !== null && x.caseIndex !== caseId) {
                if (x.caseIndex > caseId)
                    newDataSource.push({...x, caseIndex: x.caseIndex - 1})
                if (x.caseIndex < caseId)
                    newDataSource.push(x)
            } else newDataSource.push({...x, caseIndex: null})
        }
        props.setDataSource(newDataSource, name)
    }

    const tableColumns = () => [
        {title: "ID", dataIndex: "checkpointId"},
        {
            title: "输入预览", dataIndex: "inputPreview", render: (text: string) => {
                return <TextEllipsis text={text}/>
            }
        },
        {
            title: "输出预览", dataIndex: "outputPreview", render: (text: any) => {
                text = text.replace(/^\s+|\s+$/g, '')
                return <TextEllipsis text={text}/>
            }
        },
        {
            title: "输入/输出文件名", render: (text: any, row: any) => {
                if (row.inputFilename === null && row.outputFilename === null) return ""
                return `${row.inputFilename ?? ""}/${row.outputFilename ?? ""}`
            }
        },
        {
            title: "上传时间", dataIndex: "gmtCreate", render: (text: any, row: any) => {
                return unix2Time(row.gmtCreate)
            }
        },
        {
            title: `分数`,
            dataIndex: "checkpointScore",
            shouldCellUpdate: (record: any, prevRecord: any) => {
                return false
            },
            render: (text: any, row: any) => {
                return (
                    <Form.Item name={row.checkpointId} className={"mgb0"} style={{width: 100}}>
                        <Input/>
                    </Form.Item>
                )
            }
        },
        {
            title: "操作", render: (text: any, row: any) => {
                return <>
                    <Button type={"link"} onClick={() => {
                        mApi.zipDownload([
                            {id: row.inputFileId, downloadFilename: row.inputFilename ?? `${row.checkpointId}.in`},
                            {id: row.outputFileId, downloadFilename: row.outputFilename ?? `${row.checkpointId}.out`}
                        ])
                    }}><DownloadOutlined/></Button>
                    <TableRowDeleteButton
                        tableName={name}
                        rowKey={"checkpointId"}
                        data={row.checkpointId}
                        btnText={<DeleteOutlined/>}
                        btnProps={{type: "link", danger: true, style: {padding: 0}}}
                    />
                    <Button
                        icon={row.caseIndex === null ? <PlusOutlined/> : <MinusOutlined/>}
                        style={{color: "gray"}}
                        type={"link"}
                        size={"small"}
                        onClick={() => {
                            if (row.caseIndex === null) setCase(row.checkpointId)
                            else removeCase(row.checkpointId)
                        }}
                    />
                </>
            }
        },
        {
            title: "样例点",
            width: 120,
            render: (text: any, row: any) => {
                const caseIndex = row.caseIndex
                return <>
                    {!isValueEmpty(caseIndex) && (
                        <Tag style={{marginLeft: 20}}>Case {caseIndex}</Tag>
                    )}
                </>
            }
        }
    ];


    return (
        <>
            <Button type={"link"} size={"small"} onClick={() => setVis(true)}> {props.t("Checkpoint")} </Button>
            <Modal
                title={`${props.problemCode} ${props.title}`}
                onCancel={() => setVis(false)}
                visible={vis}
                destroyOnClose={true}
                width={1200}
                footer={
                    <>
                        <Button onClick={() => setVis(false)}>取消</Button>
                        <Button type={"primary"} onClick={() => {
                            form.validateFields().then((res) => {
                                let checkpoints: any = []
                                let caseMap: any = {}
                                for (let x of dataSource) {
                                    checkpoints.push({
                                        checkpointId: x.checkpointId,
                                        checkpointScore: res[x.checkpointId]
                                    })
                                    if (x.caseIndex !== null)
                                        caseMap[x.caseIndex] = x.checkpointId
                                }
                                let checkPointCases: any = []
                                for (let x of Object.keys(caseMap).sort()) {
                                    checkPointCases.push(caseMap[x])
                                }
                                mApi.updateProblemCheckpoints({
                                    problemCode: props.problemCode,
                                    checkpoints: checkpoints,
                                    checkpointCases: checkPointCases
                                }).then((res) => {
                                    message.success("成功")
                                    setVis(false)
                                })

                            })
                        }}> 保存 </Button>
                    </>
                }
            >
                <Form form={form} onValuesChange={(_, val) => {
                    let score = 0
                    for (const x in val) {
                        try {
                            if (!isValueEmpty(val[x]))
                                score += parseInt(val[x])
                        } catch (e) {
                        }
                    }
                    setSumScore(score)
                }}>
                    <TableWithSelection
                        uesAlldata={true}
                        useDrag={true}
                        rowKey={"checkpointId"}
                        name={name}
                        size={"small"}
                        columns={tableColumns()}
                        API={() => {
                            return mApi.getCheckpointList(props.problemCode)
                        }}
                        pagination={false}
                    />
                </Form>
                <div style={{marginTop: 20, height: 20}}>
                    <div style={{float: "left"}}>
                        <Space>
                            <Button
                                type={"primary"}
                                onClick={() => {
                                    let data: any = []
                                    selectedRowKeys.map((value: any) => {
                                        const pos = dataSource.findIndex((it: any) => it.checkpointId === value)
                                        data.push({
                                            id: dataSource[pos].inputFileId,
                                            downloadFilename: dataSource[pos].inputFilename ?? `${dataSource[pos].checkpointId}.in`
                                        })
                                        data.push({
                                            id: dataSource[pos].outputFileId,
                                            downloadFilename: dataSource[pos].outputFilename ?? `${dataSource[pos].checkpointId}.out`
                                        })
                                    })
                                    mApi.zipDownload(data).catch((e: any) => {
                                        message.error(e)
                                    });
                                }}
                            >批量下载</Button>
                            <ButtonWithSelection
                                type={"delete"}
                                ButtonText={"批量删除"}
                                rowKey={"checkpointId"}
                                tableName={name}
                            />
                            <ModalFormUseForm
                                btnName={"上传"}
                                btnIcon={false}
                                btnType={"default"}
                                title={"新增测试点"}
                                subForm={[
                                    {component: <FormCheckPointsUpload/>, label: ""},
                                ]}
                                dataSubmitter={(value: any) => {
                                    if (value.type === "s") {
                                        return mApi.uploadSingleCheckpoint(value)
                                    } else if (value.type === "m") {
                                        const formData = new FormData();
                                        for (let file of value.files)
                                            formData.append('files', file);
                                        formData.append("mode", value.mode)
                                        return mApi.uploadCheckpointFiles(formData)
                                    }
                                }}
                                afterSubmit={(res: any) => {
                                    let newData = [...dataSource]
                                    if (Array.isArray(res)) {
                                        for (let x of res) newData.push({...x, caseIndex: null, checkpointScore: 0})
                                    } else newData.push({...res, caseIndex: null, checkpointScore: 0})
                                    props.setDataSource(newData, name)
                                }}
                            />
                        </Space>
                    </div>
                    <div style={{float: "right"}}>
                        <Form layout={"horizontal"}>
                            <Form.Item label={"总分"} style={{width: 250}} className={"mgb0"}>
                                <Space>
                                    <Input value={sumScore} onChange={(e) => {
                                        try {
                                            if (isValueEmpty(e.target.value)) setSumScore(0)
                                            else setSumScore(parseInt(e.target.value))
                                        } catch (ex) {
                                        }
                                    }}/>
                                    <Button type={"primary"} onClick={() => {
                                        let formData: any = form.getFieldsValue(), len = Object.keys(formData).length
                                        let score = Math.floor(sumScore / len), lftS = sumScore - score * len, cnt = 0
                                        for (let x in formData) {
                                            cnt++
                                            formData[x] = score + (cnt > len - lftS ? 1 : 0)
                                        }
                                        form.setFieldsValue(formData)
                                    }}>{"平均分配"}</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Modal>
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
    setDataSource: (data: any, name: string) =>
        dispatch({type: "setDataSource", data: data, name: name, add: true})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProCheckPoints))