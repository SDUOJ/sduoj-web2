import {Button, Form, Input, message, Modal, Space, Tag} from "antd";
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

function DeleteOutlined() {
    return null;
}

const ProCheckPoints = (props: any) => {
    const [vis, setVis] = useState<boolean>(false)
    const [sumScore, setSumScore] = useState<number>(0)
    const [caseInfo, setCaseInfo] = useState<any>({})
    const name = `ProCheckPoints-${props.problemCode}`

    const [form] = useForm();

    const CheckPointsForm = (
        <>
            <ItemTitle/>
            <ItemSwitch
                name={"isPublic"}
                label={"公开性"}
                ck={"公开"}
                unck={"不公开"}
            />
            <ItemEditor
                name={"markdownDescription"}
                label={"题面"}
            />
        </>
    )

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

    const selectedRowKeys = props.tableData[name]?.selectedRowKeys ?? []
    const dataSource = props.tableData[name]?.dataSource;

    const setCase = (ckId: string)=>{

    }

    const removeCase = (ckId: string)=>{

    }

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
                        <Button>取消</Button>
                        <Button type={"primary"}> 保存 </Button>
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
                        columns={[
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
                                    const caseIndex = caseInfo[row.checkpointId]
                                    return <>
                                        <Button type={"link"} onClick={() => {
                                            mApi.zipDownload([
                                                {id: row.inputFileId, downloadFilename: `${row.checkpointId}.in`},
                                                {id: row.outputFileId, downloadFilename: `${row.checkpointId}.out`}
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
                                            icon={isValueEmpty(caseIndex) ? <PlusOutlined/> : <MinusOutlined/>}
                                            style={{color: "gray"}}
                                            type={"link"}
                                            size={"small"}
                                            onClick={()=>{
                                                if(isValueEmpty(caseIndex)) setCase(row.checkpointId)
                                                else removeCase(row.checkpointId)
                                            }}
                                        />
                                        {!isValueEmpty(caseIndex) && (
                                            <Tag style={{marginLeft: 20}}>Case {caseIndex}</Tag>
                                        )}

                                    </>
                                }
                            },
                        ]}
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
                                            downloadFilename: `${dataSource[pos].checkpointId}.in`
                                        })
                                        data.push({
                                            id: dataSource[pos].outputFileId,
                                            downloadFilename: `${dataSource[pos].checkpointId}.out`
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
                            <Button>上传</Button>
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
        dispatch({type: "setDataSource", data: data, name: name, add: false})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProCheckPoints))