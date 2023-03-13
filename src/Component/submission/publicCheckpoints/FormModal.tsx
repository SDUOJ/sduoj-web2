import {Button, Card, message, Modal, Popconfirm, Space, Table, Tag} from "antd";
import {useTranslation} from "react-i18next";
import React, {useEffect, useState} from "react";
import {unix2Time} from "../../../Utils/Time";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";
import FormCheckPointsUpload from "../../problem/From/FormCheckPointsUpload";
import mApi from "../../../Utils/API/m-api";
import {DeleteOutlined, DownloadOutlined} from "@ant-design/icons";

const PublicCheckpointsFormModal = (props: any) => {

    const {t} = useTranslation()
    const [vis, setVis] = useState<boolean>(false)

    const [data, setData] = useState<any>()
    const [load, setLoad] = useState<boolean>(false)

    const updData = () => {
        if(load) return
        setLoad(true)
        props.getPublicCheckpoints().then((res: any) => {
            setData(res)
        }).finally(()=>{
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
        if (props.getPublicCheckpoints !== undefined) {
            updData()
        }
    }, [props.getPublicCheckpoints])

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
                                let newData = []
                                if (Array.isArray(res)) {
                                    for (let x of res) newData.push({...x})
                                } else newData.push({...res})
                                props.addPublicCheckpoints({
                                    type: 1,
                                    checkpoints: newData
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
                                                    }).then(()=>{
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
                                            {row.status === 0 && (
                                                <>
                                                    <Button
                                                        type={"link"}
                                                        size={"small"}
                                                        onClick={() => upd(row.checkpointId, 1)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        type={"link"}
                                                        size={"small"}
                                                        onClick={() => upd(row.checkpointId, 2)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}
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
