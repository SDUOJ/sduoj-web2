import {withTranslation} from "react-i18next";
import {Button, Card, Form, Input, message, Select, Space} from "antd";
import {SyncJudging} from "../SyncJudging";
import cApi from "../../../Utils/API/c-api";
import {ReloadOutlined} from "@ant-design/icons";
import {RunningResultList, StateList, SubmissionMap, TopSubmissionInfoType} from "../../../Type/ISubmission";
import TestCase from "../TestCase";
import React, {Dispatch, useState} from "react";
import moment from "moment";
import TableWithSelection from "../../common/Table/TableWithSelection";
import ReJudge from "../Func/ReJudge";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {TableState} from "../../../Type/ITable";
import {ck, isValueEmpty} from "../../../Utils/empty";
import {UserState} from "../../../Type/Iuser";
import judgeAuth from "../../../Utils/judgeAhtu";

const SubmissionList = (props: any) => {

    // 为了动态显示评测点信息，使用 ws 与后端进行链接
    // ws 是否打开
    const [webSocketOpen, setWebSocketOpen] = useState<boolean>(false)
    // ws 发送的信息（在打开时，当前数据的变更将同步发送至 ws）
    const [webSocketQueryList, setWebSocketQueryList] = useState<string[]>([])
    const [refreshDisable, setRefreshDisable] = useState<boolean>(false)

    const selectedRowKeys = ck(props.tableData[props.name]?.selectedRowKeys, [])
    const dataSource = ck(props.tableData[props.name]?.dataSource, [])

    const addCaseInfo = (data: any[]) => {
        let dt = dataSource
        const Index = dt.findIndex((value: any) => value.submissionId === data[0])
        if (Index === -1) return
        if (data[1] < 0) {
            dt[Index].result = data[1].toString()
            if (data[1] === -1) {
                if (data.length > 3) {
                    dt[Index].result = data[2]
                    dt[Index].score = data[3]
                    dt[Index].usedTime = data[4]
                    dt[Index].usedMemory = data[5]
                }
            }
            // 检查还有没有未更新完的
            let runningNumber = 0
            for (const x of dt) if (parseInt(x.result) <= 0) runningNumber += 1
            if (runningNumber === 0) setWebSocketOpen(false)
        } else {
            if (dt[Index].RunningStep < data[1] + 1) {
                dt[Index].RunningStep = data[1] + 1
                dt[Index].score += data[3]
            }
        }
        props.setDataSource(dt, props.name)
    }
    const columns = [
        {
            title: props.t("results"),
            dataIndex: "result",
            key: "result",
            render: (text: any, record: any) => {
                return (
                    <div onClick={() => {
                        props.setTopSubmission(record.submissionId, {
                            title: record.problemTitle,
                            TimeLimit: record.timeLimit,
                            MemoryLimit: record.memoryLimit,
                            scoreMod: record.sumScore === undefined ? "disable" : "show",
                            sumScore: record.sumScore,
                            testcaseMod: "show",
                            QuerySubmissionAPI: props.QuerySubmissionAPI
                        })
                        props.setSubmissionModalVis(true)
                    }}>
                        <TestCase
                            type={"text"}
                            caseType={StateList.indexOf(SubmissionMap[text])}
                            append={text === "-2" ? "(" + record.RunningStep + "/" + record.checkpointNum + ")" : ""}
                        />
                    </div>

                )
            }
        },
        {
            title: props.t("score"),
            dataIndex: "score",
            key: "score",
            render: (text: number, record: any) => {
                if (record.sumScore === undefined)
                    return text
                return Math.floor(text / record.sumScore * 100) + "%"
            }
        },
        {
            title: props.t("submissionTime"),
            dataIndex: "submitTime",
            key: "submitTime",
            render: (text: any) => {
                return moment(text).fromNow();
            }
        }
    ]

    const columnsAll = [
        {
            title: "ID",
            dataIndex: "submissionId",
            key: "submissionId",
            render: (text: any, record: any) => {
                return <Button type={"link"} size={"small"} onClick={() => {
                    props.setTopSubmission(record.submissionId, {
                        title: record.problemTitle,
                        TimeLimit: record.timeLimit,
                        MemoryLimit: record.memoryLimit,
                        scoreMod: record.sumScore === undefined ? "disable" : "show",
                        sumScore: record.sumScore,
                        testcaseMod: "show",
                        QuerySubmissionAPI: props.QuerySubmissionAPI,
                        RejudgeAPI: props.RejudgeAPI,
                        InvalidateAPI: props.InvalidateAPI
                    })
                    props.setSubmissionModalVis(true)
                }}>
                    {text}
                </Button>
            }
        },
        {
            title: props.t("username"),
            dataIndex: "username",
            key: "username"
        },
        {
            title: props.t("problemNo."),
            dataIndex: "problemCode",
            key: "problemCode",
            render: props.problemCodeRender
        },
        {
            title: props.t("problemName"),
            dataIndex: "problemTitle",
            key: "problemTitle"
        },
        {
            title: props.t("results"),
            dataIndex: "result",
            key: "result",
            width: 170,
            render: (text: any, record: any) => {
                return <TestCase
                    type={"text"}
                    caseType={StateList.indexOf(SubmissionMap[text])}
                    append={text === "-2" ? "(" + record.RunningStep + "/" + record.checkpointNum + ")" : ""}
                />
            }
        },
        {
            title: props.t("score"),
            dataIndex: "score",
            key: "score",
            render: (text: number, record: any) => {
                if (record.sumScore === undefined)
                    return text
                return Math.floor(text / record.sumScore * 100) + "%"
            }
        },
        {
            title: props.t("template"),
            dataIndex: "judgeTemplateTitle",
            key: "judgeTemplateTitle"
        },
        {
            title: props.t("memoryUsage"),
            dataIndex: "usedMemory",
            key: "usedMemory",
            render: (text: any) => {
                return text + " KB"
            }
        },
        {
            title: props.t("timeUsage"),
            dataIndex: "usedTime",
            key: "usedTime",
            render: (text: any) => {
                return text + " ms"
            }
        },
        {
            title: props.t("submissionTime"),
            dataIndex: "submitTime",
            key: "submitTime",
            render: (text: any) => {
                return moment(text).fromNow();
            }
        }
    ]

    const getForm = (onFinish: any) => {
        return (
            <Space size={30}>
                <Form.Item label={props.t("username")} name={"username"}>
                    <Input
                        onPressEnter={(e: any) => {
                            onFinish()
                        }}
                        allowClear
                    />
                </Form.Item>
                <Form.Item label={props.t("problemNo.")} name={"problemCode"}>
                    <Input
                        onPressEnter={(e: any) => {
                            onFinish()
                        }}
                        allowClear
                    />
                </Form.Item>
                <Form.Item label={props.t("JudgeResult")} name={"judgeResult"}>
                    <Select onChange={onFinish} allowClear style={{width: 200}}>
                        {
                            RunningResultList.map((value) => {
                                return <Select.Option value={parseInt(value)}>
                                    <TestCase type={"text"}
                                              caseType={StateList.indexOf(SubmissionMap[value])}/>
                                </Select.Option>
                            })
                        }
                    </Select>
                </Form.Item>
            </Space>
        )
    }

    const API = (data: any)=>{
        if("problemCode" in data && !isValueEmpty(data["problemCode"])){
            let v: string = data["problemCode"]
            if (v.length === 1) {
                if (v.match(/^[a-z]$/) !== null) v = (v.charCodeAt(0) - 'a'.charCodeAt(0) + 1).toString()
                if (v.match(/^[A-Z]$/) !== null) v = (v.charCodeAt(0) - 'A'.charCodeAt(0) + 1).toString()
            } else if (v.match(/^[0-9]{4}$/) !== null) {
                v = "SDUOJ-" + v
            }
            data["problemCode"] = v
        }
        return props.API(data)
    }

    return (
        <>
            <Card
                title={
                    <Space>
                        {props.title !== undefined ? props.title : props.t("submissionRecord")}
                        <SyncJudging
                            open={webSocketOpen}
                            dataHandle={addCaseInfo}
                            queryList={webSocketQueryList}/>
                    </Space>
                }
                style={props.lessInfo ? {} : {minWidth: 1200}}
                className={props.lessInfo ? "smallBodyPadding" : ""}
                extra={
                    <Space>
                        {props.lessInfo !== true && judgeAuth(props.roles, ["admin", "superadmin"]) && (
                            <ReJudge
                                API={cApi.rejudge}
                                data={selectedRowKeys}
                                afterSuccess={() => {
                                    props.addTableVersion(props.name)
                                    props.setSelectedRowKeys([], props.name)
                                }}
                            />
                        )}
                        <Button
                            icon={<ReloadOutlined/>}
                            onClick={() => {
                                setRefreshDisable(true)
                                props.addTableVersion(props.name)
                                message.success(props.t("refreshSuccessfully"))
                                setTimeout(() => {
                                    setRefreshDisable(false)
                                }, 3000)
                            }}
                            disabled={refreshDisable}
                        >
                            {props.t("refresh")}
                        </Button>
                    </Space>
                }
            >
                <TableWithSelection
                    disableSelection={props.lessInfo || !judgeAuth(props.roles, ["admin", "superadmin"])}
                    defaultPageSize={props.lessInfo ? 5 : undefined}
                    showSizeChanger={props.lessInfo ? false : undefined}
                    columns={props.lessInfo ? columns : columnsAll}
                    getForm={props.useForm === true ? getForm : undefined}
                    name={props.name}
                    size={"small"}
                    rowKey={"submissionId"}
                    API={API}
                    APIRowsTransForm={(value: any) => {
                        if (isValueEmpty(value)) value = []
                        let webSocketQueryList = []
                        let data: any = []
                        for (const x of value) {
                            if (x.judgeResult <= 0) webSocketQueryList.push(x.submissionId)
                            data.push({
                                ...x,
                                score: x.judgeScore,
                                RunningStep: 0,
                                result: x.judgeResult.toString(),
                                // sumScore: ck(x.sumScore, 100),
                                sumScore: x.sumScore,
                                submitTime: parseInt(x.gmtCreate),
                            })
                        }
                        if (webSocketQueryList.length !== 0) {
                            setWebSocketOpen(true)
                            setWebSocketQueryList(webSocketQueryList)
                        }
                        return data
                    }}
                />
            </Card>
        </>
    )
}


const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    const UState: UserState = state.UserReducer
    return {
        tableData: TState.tableData,
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({
        type: "addTableVersion",
        name: name,
    }),
    setSelectedRowKeys: (data: React.Key[], name: string) =>
        dispatch({type: "setSelectedRowKeys", data: data, name: name}),
    setDataSource: (data: any, name: string) =>
        dispatch({type: "setDataSource", data: data, name: name, add: true}),
    setTopSubmission: (submissionID: string, submissionInfo: TopSubmissionInfoType) => dispatch({
        type: "setTopSubmission",
        submissionID: submissionID,
        submissionInfo: submissionInfo
    }),
    setSubmissionModalVis: (data: boolean) => dispatch({type: "setSubmissionModalVis", data: data})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
    withRouter(SubmissionList)
))
