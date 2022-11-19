import {withRouter} from "react-router-dom";
import Title from "antd/es/typography/Title";
import React, {Dispatch, useEffect, useState} from "react";
import {Alert, Button, Card, Form, InputNumber, message, Select, Space, Tag} from "antd";
import extApi from "../../Utils/API/ext-api";
import cApi from "../../Utils/API/c-api";
import {isValueEmpty} from "../../Utils/empty";
import MarkdownText from "../../Utils/MarkdownText";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import ItemTime from "../../Component/common/Form/Item/ItemTime";
import judgeAuth from "../../Utils/judgeAhtu";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import {DownloadOutlined, UploadOutlined} from "@ant-design/icons";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {TimeDiff, unix2Time} from "../../Utils/Time";
import ModalMarkdown from "../../Component/common/ModalMarkdown";
import SubmitInfo from "../../Component/ExtHws/SubmitInfo";
import Reconfirm from "../../Component/common/Reconfirm";
import ItemUploadUser from "../../Component/common/Form/Item/ItemUploadUser";
import TableWithAllData from "../../Component/common/Table/TableWithAllData";
import ItemUploadFileMulti from "../../Component/ExtHws/ItemUploadFileMulti";
import MoveModal from "../../Component/ExtHws/MoveModal";
import {brotliCompress} from "zlib";
import LoginCheck from "../../Component/common/LoginCheck";


const ExtHwsInfo = (props: any) => {
    const cid = props.match.params.cid
    const [data, setData] = useState<any>(null)

    let form = (
        <>
            <ItemText name={"name"} label={"收集项名"} required={true}/>
            <ItemText name={"tag"} label={"收集项标签"} required={true}/>
            <ItemTime name={"deadline"} label={"截止时间"} required={true}/>
            <Form.Item name={"submit_type"} label={"文件后缀"} required>
                <Select mode="tags" style={{width: '100%'}}/>
            </Form.Item>
            <Form.Item name={"submit_max_size_MB"} label={"文件大小限制"} required>
                <InputNumber addonAfter="MB"/>
            </Form.Item>
            <ItemEditor name={"description"} label={"收集描述"}/>
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
            title: "收集项名",
            dataIndex: "name",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
            render: (text: string, rows: any) => {
                return <>
                    <ModalMarkdown
                        id={"Ext-HwsInfo-des-hw-" + rows.hid}
                        text={rows.description}
                        title={rows.name + " 详情预览"}
                        btnText={text}
                    />
                </>

            }
        },
        {
            title: "创建时间",
            dataIndex: "create_time",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: "截止时间",
            dataIndex: "deadline",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: "剩余时间",
            dataIndex: "deadline",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (text: string) => {
                if(Date.now() <= parseInt(text)){
                    return TimeDiff(Date.now(), parseInt(text)).split("分")[0] + "分"
                } else{
                    return "已结束"
                }
            }
        },
        {
            title: "标签",
            dataIndex: "tag",
            width: "auto",
            filters: [],
            responsive: ["lg"],
        },
        {
            title: "我的提交",
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
            title: "提交时间",
            width: "auto",
            dataIndex: "submit_time",
            render: (text: any, rows: any) => {
                if (text === null) {
                    return <Tag color={"red"}> 未提交 </Tag>
                } else {
                    const before = parseInt(text) <= parseInt(rows.deadline)
                    return <>
                        {before && (<Tag color={"green"}>已提交</Tag>)}
                        {!before && (<Tag color={"orange"}>延期</Tag>)}
                        {unix2Time(parseInt(text))}
                    </>
                }

            }
        },
        {
            title: "操作",
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
                                btnName={"提交"}
                                title={rows.name}
                                type={"create"}
                                subForm={[
                                    {
                                        component: <>
                                            <ItemUploadUser
                                                label={"提交文件"}
                                                name={"file_id"}
                                                filenameKey={"file_name"}
                                                required={false}
                                                accept={accept}
                                                max_size={rows.submit_max_size_MB}
                                            />
                                        </>,
                                        label: "基本信息"
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
                                    btnText={"撤回"}
                                    confirm={props.username}
                                    API={() => {
                                        extApi.hwCancelSubmit({sid: rows.sid}).then((res) => {
                                            message.success("撤回成功")
                                            props.addTableVersion("Ext-hwsHomeworkList")
                                        })
                                    }}
                                    todo={`撤回提交 ${rows.file_name} `}
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
            title: "我的提交",
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
            title: "提交时间",
            width: "auto",
            dataIndex: "create_time",
            render: (text: any, rows: any) => {
                return unix2Time(parseInt(text))
            }
        },
        {
            title: "操作",
            width: "150px",
            render: (text: any, rows: any) => {
                return <Space size={16}>
                    <MoveModal cid={cid} btnText={"转移"} sid={rows.sid} clone={false}/>
                    <MoveModal cid={cid} btnText={"克隆转移"} sid={rows.sid} clone={true}/>
                </Space>
            }

        }
    ]

    if (judgeAuth(props.roles, ["admin"])) {
        colData.push({
            title: "管理员操作",
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        <ModalFormUseForm
                            TableName={"Ext-hwsHomeworkList"}
                            width={1200}
                            title={"编辑(" + rows.name + ")"}
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
                            filename={rows.name + "_打包下载_" + Date.now().toString()}
                        />
                    </Space>

                )
            }
        })
        colDataPre.push({
            title: "管理员操作",
            width: "150px",
            render: (text: any, rows: any) => {
                return (
                    <Space size={3}>
                        <Reconfirm
                            btnProps={{type: "link", size: "small"}}
                            btnText={"删除"}
                            confirm={props.username}
                            API={() => {
                                extApi.hwCancelSubmit({sid: rows.sid}).then((res) => {
                                    message.success("删除成功")
                                    props.addTableVersion("Ext-hwsHomeworkList-pre")
                                })
                            }}
                            todo={`删除提交 ${rows.file_name} `}
                        />
                    </Space>

                )
            }
        })
    }


    return (
        <>
            <LoginCheck/>
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
                                                    title={"新增收集项"}
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
                                                btnName={"预设提交"}
                                                title={"预设提交"}
                                                type={"create"}
                                                subForm={[
                                                    {
                                                        component: <>
                                                            <ItemUploadFileMulti
                                                                label={"提交文件"}
                                                                name={"data"}
                                                                required={false}
                                                                cid={cid}
                                                            />
                                                        </>,
                                                        label: "基本信息"
                                                    }
                                                ]}
                                                dataSubmitter={(value: any) => {
                                                    if (value.length === 0) {
                                                        return Promise.reject("请先点击 上传文件 按钮，然后再提交")
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
                                                <Title level={4}> 收集说明 </Title>
                                                <MarkdownText id={"ExtHwsInfo-description"} text={data.description}/>
                                            </>
                                        )}
                                    <Title level={4} style={{marginTop: 24}}> 收集项列表 </Title>
                                    <TableWithPagination
                                        name={"Ext-hwsHomeworkList"}
                                        columns={colData}
                                        API={(data: any) => {
                                            return extApi.getHomeworkList({cid: cid, ...data})
                                        }}
                                        size={"small"}
                                    />
                                    <Title level={4} style={{marginTop: 24}}> 预设提交列表 </Title>
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