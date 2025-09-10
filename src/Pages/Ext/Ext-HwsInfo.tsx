import {withRouter} from "react-router-dom";
import Title from "antd/es/typography/Title";
import React, {Dispatch, useEffect, useState} from "react";
import {Button, Card, Form, InputNumber, message, Select, Space, Tag} from "antd";
import extApi from "../../Utils/API/ext-api";
import cApi from "../../Utils/API/c-api";
import {isValueEmpty} from "../../Utils/empty";
import MarkdownText from "../../Utils/MarkdownText";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import ItemTime from "../../Component/common/Form/Item/ItemTime";
import judgeAuth from "../../Utils/judgeAhtu";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import {UploadOutlined} from "@ant-design/icons";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import ModalMarkdown from "../../Component/common/ModalMarkdown";
import SubmitInfo from "../../Component/ExtHws/SubmitInfo";
import Reconfirm from "../../Component/common/Reconfirm";
import ItemUploadUser from "../../Component/common/Form/Item/ItemUploadUser";
import ItemUploadFileMulti from "../../Component/ExtHws/ItemUploadFileMulti";
import MoveModal from "../../Component/ExtHws/MoveModal";
import LoginCheck from "../../Component/common/LoginCheck";
import {useTranslation} from "react-i18next";


const ExtHwsInfo = (props: any) => {
    const cid = props.match.params.cid
    const {t} = useTranslation()
    const [data, setData] = useState<any>(null)

    let form = (
        <>
            <ItemText name={"name"} label={t("CollectItemName")} required={true}/>
            <ItemText name={"tag"} label={t("CollectItemTag")} required={true}/>
            <ItemTime name={"deadline"} label={t("Deadline")} required={true}/>
            <Form.Item name={"submit_type"} label={t("FileSuffix")} required>
                <Select mode="tags" style={{width: '100%'}}/>
            </Form.Item>
            <Form.Item name={"submit_max_size_MB"} label={t("FileSizeLimit")} required>
                <InputNumber addonAfter="MB"/>
            </Form.Item>
            <ItemEditor name={"description"} label={t("CollectDescription")}/>
        </>
    )


    useEffect(() => {
        if (data === null)
            extApi.getCourseInfo({cid: cid}).then((res) => {
                setData(res)
            })
    }, [cid, data, setData])


    let colData: any[] = [
        {
            title: "ID",
            dataIndex: "hid",
            width: 50,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: t("CollectItemName"),
            dataIndex: "name",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
            render: (text: string, rows: any) => {
                return <>
                    <ModalMarkdown
                        id={"Ext-HwsInfo-des-hw-" + rows.hid}
                        text={rows.description}
                        title={t("DetailPreviewWithName", {name: rows.name})}
                        btnText={text}
                    />
                </>

            }
        },
        {
            title: t("CreateTime"),
            dataIndex: "create_time",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: t("Deadline"),
            dataIndex: "deadline",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: t("TimeLeft"),
            dataIndex: "deadline",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                if(Date.now() <= parseInt(text)){
            return TimeDiff(Date.now(), parseInt(text)).split(t("MinuteShort"))[0] + t("MinuteShort")
                } else{
            return t("Finished")
                }
            }
        },
        {
        title: t("Tag"),
            dataIndex: "tag",
            width: "auto",
            filters: [],
            responsive: ["lg"],
        },
        {
        title: t("MySubmission"),
            width: "auto",
            render: (text: any, rows: any) => {
                if (rows.file_id !== null) {
                    return (
                        <Button type={"link"} size={"small"} onClick={() => {
                            window.open(cApi.getFileDownloadUrl(rows.file_id, rows.file_name))
                        }}> {rows.file_name} </Button>

                    )
                }
            }
        },
        {
            title: t("SubmitTime"),
            width: "auto",
            dataIndex: "submit_time",
            render: (text: any, rows: any) => {
                if (text === null) {
                    return <Tag color={"red"}> {t("NotSubmitted")} </Tag>
                } else {
                    const before = parseInt(text) <= parseInt(rows.deadline)
                    return <>
                        {before && (<Tag color={"green"}>{t("Submitted")}</Tag>)}
                        {!before && (<Tag color={"orange"}>{t("Delayed")}</Tag>)}
                        {unix2Time(parseInt(text))}
                    </>
                }

            }
        },
        {
            title: t("operator"),
            width: "auto",
            render: (text: any, rows: any) => {
                let accept = "", num = 0
                for (const x of rows.submit_type.split(",")) {
                    if (num !== 0) accept += ','
                    if (x[0] === '.') accept += x
                    else accept += '.' + x
                    num += 1
                }
                return (
                    <Space size={3}>
                        {rows.file_id === null && (
                            <ModalFormUseForm
                                TableName={"Ext-hwsHomeworkList"}
                                width={600}
                                btnType={"link"}
                                btnProps={{size: "small"}}
                                btnIcon={false}
                btnName={t("Submit")}
                                title={rows.name}
                                type={"create"}
                                subForm={[
                                    {
                                        component: <>
                                            <ItemUploadUser
                        label={t("SubmitFile")}
                                                name={"file_id"}
                                                filenameKey={"file_name"}
                                                required={false}
                                                accept={accept}
                                                max_size={rows.submit_max_size_MB}
                                            />
                                        </>,
                    label: t("BasicInformation")
                                    }
                                ]}
                                dataSubmitter={(value: any) => {
                                    value.cid = cid
                                    value.hid = rows.hid
                                    return extApi.hwSubmit(value)
                                }}
                            />
                        )}
                        {rows.file_id !== null && (
                            <>
                                <Reconfirm
                                    btnProps={{type: "link", size: "small"}}
                    btnText={t("Withdraw")}
                                    confirm={props.username}
                                    API={() => {
                                        extApi.hwCancelSubmit({sid: rows.sid}).then((res) => {
                        message.success(t("WithdrawSuccess"))
                                            props.addTableVersion("Ext-hwsHomeworkList")
                                        })
                                    }}
                    todo={`${t("WithdrawSubmit")} ${rows.file_name} `}
                                />
                            </>
                        )}
                    </Space>
                )
            }
        }
    ]

    const colDataPre: any = [
        {
            title: "ID",
            dataIndex: "sid",
            width: 50,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: t("MySubmission"),
            width: "auto",
            render: (text: any, rows: any) => {
                if (rows.file_id !== null) {
                    return (
                        <Button type={"link"} size={"small"} onClick={() => {
                            window.open(cApi.getFileDownloadUrl(rows.file_id, rows.file_name))
                        }}> {rows.file_name} </Button>
                    )
                }
            }
        },
        {
        title: t("SubmitTime"),
            width: "auto",
            dataIndex: "create_time",
            render: (text: any, rows: any) => {
                return unix2Time(parseInt(text))
            }
        },
        {
        title: t("operator"),
            width: "150px",
            render: (text: any, rows: any) => {
                return <Space size={16}>
            <MoveModal cid={cid} btnText={t("Move")} sid={rows.sid} clone={false}/>
            <MoveModal cid={cid} btnText={t("CloneMove")} sid={rows.sid} clone={true}/>
                </Space>
            }

        }
    ]

    if (judgeAuth(props.roles, ["admin"])) {
        colData.push({
            title: t("AdminOperation"),
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        <ModalFormUseForm
                            TableName={"Ext-hwsHomeworkList"}
                            width={1200}
                title={t("EditWithName", {name: rows.name})}
                            type={"update"}
                            subForm={[{component: form, label: ""}]}
                            formName={"Ext-hwsCourseList-Form"}
                            updateAppendProps={{hid: rows.hid}}
                            initData={rows}
                            dataSubmitter={(value: any) => {
                                value.submit_type = value.submit_type.toString()
                                value.cid = cid
                                return extApi.editHomework(value)
                            }}
                        />
                        <SubmitInfo
                            groupId={data?.groupId} hid={rows.hid} deadline={rows.deadline}
                            filename={`${rows.name}_${t("BatchDownload")}_${Date.now().toString()}`}
                        />
                    </Space>

                )
            }
        })
        colDataPre.push({
        title: t("AdminOperation"),
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        <Reconfirm
                            btnProps={{type: "link", size: "small"}}
                btnText={t("delete")}
                            confirm={props.username}
                            API={() => {
                                extApi.hwDeleteSubmit({sid: rows.sid}).then((res) => {
                    message.success(t("deleteSuccess"))
                                    props.addTableVersion("Ext-hwsHomeworkList-pre")
                                })
                            }}
                todo={`${t("DeleteSubmit")} ${rows.file_name} `}
                        />
                    </Space>

                )
            }
        })
    }


    return (
        <>
            <LoginCheck jump={true}/>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                    <div>
                        {data !== null && (
                            <>
                                <Card
                                    title={
                                        <Title level={2}>{data.name}
                                            <span style={{color: "grey"}}> (ID: {data.cid})</span>
                                        </Title>
                                    }
                                    extra={
                                        <Space>
                                            {judgeAuth(props.roles, ["admin"]) && (
                                                <ModalFormUseForm
                                                    TableName={"Ext-hwsHomeworkList"}
                                                    width={1200}
                            title={t("NewCollectItem")}
                                                    type={"create"}
                                                    subForm={[{component: form, label: ""}]}
                                                    dataSubmitter={(value: any) => {
                                                        value.submit_type = value.submit_type.toString()
                                                        value.cid = cid
                                                        return extApi.createHomework(value)
                                                    }}
                                                />
                                            )}
                                            <ModalFormUseForm
                                                TableName={"Ext-hwsHomeworkList-pre"}
                                                width={600}
                                                btnType={"default"}
                                                btnProps={{icon: <UploadOutlined/>}}
                                                btnIcon={false}
                        btnName={t("PresetSubmit")}
                        title={t("PresetSubmit")}
                                                type={"create"}
                                                subForm={[
                                                    {
                                                        component: <>
                                                            <ItemUploadFileMulti
                                label={t("SubmitFile")}
                                                                name={"data"}
                                                                required={false}
                                                                cid={cid}
                                                            />
                                                        </>,
                            label: t("BasicInformation")
                                                    }
                                                ]}
                                                dataSubmitter={(value: any) => {
                                                    if (value.length === 0) {
                            return Promise.reject(t("UploadFirstThenSubmit"))
                                                    }
                                                    return extApi.hwPreSubmit(value)
                                                }}
                                            />
                                        </Space>
                                    }
                                >
                                    {!isValueEmpty(data.description)
                                        && !isValueEmpty(data.description.trim()) && (
                                            <>
                        <Title level={4}> {t("CollectInstruction")} </Title>
                                                <MarkdownText id={"ExtHwsInfo-description"} text={data?.description}/>
                                            </>
                                        )}
                    <Title level={4} style={{marginTop: 24}}> {t("CollectItemList")} </Title>
                                    <TableWithPagination
                                        name={"Ext-hwsHomeworkList"}
                                        columns={colData}
                                        API={(data: any) => {
                                            return extApi.getHomeworkList({cid: cid, ...data})
                                        }}
                                        size={"small"}
                                    />
                    <Title level={4} style={{marginTop: 24}}> {t("HistorySubmitList")} </Title>
                                    <TableWithPagination
                                        name={"Ext-hwsHomeworkList-pre"}
                                        columns={colDataPre}
                                        API={(data: any) => {
                                            return extApi.getPreSubmit({cid: cid, ...data})
                                        }}
                                        size={"small"}
                                    />
                                </Card>
                            </>

                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer

    return {
        username: UState.userInfo?.username,
        nickname: UState.userInfo?.nickname,
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExtHwsInfo))
