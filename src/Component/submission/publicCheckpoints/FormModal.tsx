import {Button, Card, message, Modal, Popconfirm, Space, Table, Tag} from "antd";
import {useTranslation} from "react-i18next";
import React, {useEffect, useState} from "react";
import {unix2Time} from "../../../Utils/Time";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";
import mApi from "../../../Utils/API/m-api";
import {DeleteOutlined, DownloadOutlined} from "@ant-design/icons";
import UploadForm from "./UploadForm";

const PublicCheckpointsFormModal = (props: any) => {

    const {t} = useTranslation()
    const [vis, setVis] = useState<boolean>(false)

    const [data, setData] = useState<any>()
    const [load, setLoad] = useState<boolean>(false)

    const updData = () => {
        if (load) return
        setLoad(true)
        props.getPublicCheckpoints().then((res: any) => {
            setData(res)
        }).finally(() => {
            setLoad(false)
        })
    }

    const upd = (cpId: string, statue: number) => {
        props.updPublicCheckpoints({
            type: 1,
            checkpoints: [{
                checkpointId: cpId,
                status: statue
            }]
        }).then(() => {
            updData()
        })
    }

    useEffect(() => {
        updData()
    }, [])

    return (
        <>
            <Button {...props.btnProps} onClick={() => {
                setVis(true)
            }}>
                {t("public checkpoints")}
            </Button>

            <Modal
                width={1200}
                title={t("Edit checkpoints") + "-" + props.title}
                destroyOnClose={true}
                maskClosable={false}
                footer={false}
                visible={vis}
                onCancel={() => {
                    setVis(false)
                }}
            >
                <Card
                    bordered={false}
                    title={t("Checkpoint List")}
                    size={"small"}
                    extra={<>
                        <ModalFormUseForm
                            btnName={t("upload")}
                            btnIcon={false}
                            btnType={"default"}
                            title={t("addCheckpoint")}
                            subForm={[
                                {component: <UploadForm/>, label: ""},
                            ]}
                            dataSubmitter={(value: any) => {
                                value.input = value.input ?? ""
                                value.output = value.output ?? ""
                                return mApi.uploadSingleCheckpoint(value).then((res: any) => {
                                    let checkpointsData: any = []
                                    checkpointsData.push({...res, note: value.note})
                                    return Promise.resolve(checkpointsData)
                                })
                            }}
                            afterSubmit={(checkpointsData: any) => {
                                props.addPublicCheckpoints({
                                    type: 1,
                                    checkpoints: checkpointsData
                                }).then(() => {
                                    updData()
                                })
                            }}
                        />
                    </>}
                >
                    <Table
                        size={"small"}
                        dataSource={data}
                        columns={[
                            {title: t("ID"), dataIndex: "checkpointId"},
                            {title: t("InputPreview"), dataIndex: ["checkpoint", "inputPreview"]},
                            {title: t("OutputPreview"), dataIndex: ["checkpoint", "outputPreview"]},
                            {
                                title: t("Modify Time"),
                                dataIndex: "gmtModified",
                                render: (v: string) => {
                                    return unix2Time(v)
                                }
                            },
                            {title: t("owner"), dataIndex: "username"},
                            {title: t("note"), dataIndex: "note"},
                            {
                                title: t("status"),
                                dataIndex: "status",
                                render: (v: number) => {
                                    if (v === 0) return <Tag>{t("Wait")}</Tag>
                                    if (v === 1) return <Tag color={"green"}>{t("Accept")}</Tag>
                                    if (v === 2) return <Tag color={"red"}>{t("Reject")}</Tag>
                                }
                            },
                            {
                                title: t("operator"),
                                render: (v, row: any) => {
                                    return (
                                        <Space size={0}>
                                            <Button size={"small"} type={"link"} onClick={() => {
                                                mApi.zipDownload([
                                                    {
                                                        id: row.checkpoint.inputFileId,
                                                        downloadFilename: row.checkpoint.inputFilename ?? `${row.checkpointId}.in`
                                                    },
                                                    {
                                                        id: row.checkpoint.outputFileId,
                                                        downloadFilename: row.checkpoint.outputFilename ?? `${row.checkpointId}.out`
                                                    }
                                                ])
                                            }}><DownloadOutlined/></Button>
                                            <Popconfirm
                                                title={t("deleteConfirm")}
                                                onConfirm={() => {
                                                    props.delPublicCheckpoints({
                                                        type: 1,
                                                        checkpoints: [{checkpointId: row.checkpointId}]
                                                    }).then(() => {
                                                        message.success("Delete success")
                                                        updData()
                                                    })
                                                }}
                                                okText={t("yes")}
                                                cancelText={t("no")}
                                            >
                                                <Button type={"link"} danger={true} size={"small"}>
                                                    <DeleteOutlined/>
                                                </Button>
                                            </Popconfirm>
                                            <>
                                                {row.status !== 1 && (
                                                    <Button
                                                        type={"link"}
                                                        size={"small"}
                                                        onClick={() => upd(row.checkpointId, 1)}
                                                    >
                                                        {t("Accept")}
                                                    </Button>
                                                )}
                                                {row.status !== 2 && (
                                                    <Button
                                                        type={"link"}
                                                        size={"small"}
                                                        onClick={() => upd(row.checkpointId, 2)}
                                                    >
                                                        {t("Reject")}
                                                    </Button>
                                                )}
                                            </>

                                        </Space>
                                    )
                                }
                            }
                        ]}
                    />
                </Card>

            </Modal>

        </>

    )
}

export default PublicCheckpointsFormModal
