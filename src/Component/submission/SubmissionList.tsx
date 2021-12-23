import React, {Component, Dispatch} from "react";
import {Button, Card, Form, FormInstance, Input, message, Modal, Select, Space, Table} from "antd";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {
    RunningResultList,
    StateList,
    SubmissionMap,
    SubmissionState,
    TopSubmissionInfoType
} from "../../Type/ISubmission";
import TestCase from "./TestCase";
import moment from "moment";
import {setTopSubmission} from "../../Redux/Action/submission";
import {ReloadOutlined} from "@ant-design/icons"
import {Submission} from "../../Type/IProblem";
import {SyncJudging} from "./SyncJudging";
import mApi from "Utils/API/m-api"
import cApi from "Utils/API/c-api"

class SubmissionList extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            tableData: [],
            ModalVis: false,
            refreshDisable: false,
            // 动态更新状态
            webSocketOpen: false,
            webSocketQueryList: [],
            // 表格总数量
            total: 0,
            // 筛选项目
            username: undefined,
            judgeResult: undefined,
            problemCode: undefined,
            pageNow: 1,
            pageSize: 15,
            sortBy: undefined,
            ascending: undefined,
            // 当前选中的列
            selectedRowsIndex: []
        }
    }

    formRef = React.createRef<FormInstance>();

    addCaseInfo = (data: any[]) => {
        if (data[1] < 0) {
            let dt = this.state.tableData
            const Index = dt.findIndex((value: any) => value.submissionId == data[0])
            if (Index == -1) return
            dt[Index].result = data[1].toString()
            if (data[1] == -1) {
                if (data.length > 3) {
                    dt[Index].result = data[2]
                    dt[Index].score = data[3]
                    dt[Index].usedTime = data[4]
                    dt[Index].usedMemory = data[5]
                }
            }
            // 检查还有没有未更新完的
            let webSocketQueryList = []
            for (const x of dt) if (parseInt(x.result) <= 0) webSocketQueryList.push(x.submissionId)
            if (webSocketQueryList.length === 0) {
                this.setState({
                    tableData: dt,
                    webSocketOpen: false
                })
            } else this.setState({tableData: dt})

        } else {
            let dt = this.state.tableData
            const Index = dt.findIndex((value: any) => value.submissionId == data[0])
            if (Index == -1) return
            if (dt[Index].RunningStep < data[1] + 1) {
                dt[Index].RunningStep = data[1] + 1
                dt[Index].score += data[3]
            }
            this.setState({tableData: dt})
        }
    }

    updateList = (IsMessage: boolean = false) => {
        mApi.getExamSubmission({
            username: this.state.username,
            judgeResult: this.state.judgeResult,
            problemCode: this.state.problemCode,
            pageNow: this.state.pageNow,
            pageSize: this.state.pageSize,
            sortBy: this.state.sortBy,
            ascending: this.state.ascending,
            examId: this.props.examId
        }).then((resData: any) => {
            let data: any = []
            if (resData === null) resData = []
            let webSocketQueryList = []
            this.setState({
                total: resData.totalNum
            })
            resData = resData.rows
            for (const x of resData) {
                if (x.judgeResult <= 0) webSocketQueryList.push(x.submissionId)
                data.push({
                    username: x.username,
                    problemCode: x.problemCode,
                    problemTitle: x.problemTitle,
                    checkpointNum: x.checkpointNum,
                    RunningStep: 0,
                    submissionId: x.submissionId,
                    result: x.judgeResult.toString(),
                    score: x.judgeScore,
                    sumScore: x.sumScore == undefined ? 100 : x.sumScore,
                    timeLimit: x.timeLimit,
                    memoryLimit: x.memoryLimit,
                    submitTime: parseInt(x.gmtCreate),
                    judgeTemplateTitle: x.judgeTemplateTitle,
                    usedMemory: x.usedMemory,
                    usedTime: x.usedTime,
                })
            }
            if (webSocketQueryList.length !== 0) {
                this.setState({
                    webSocketOpen: true,
                    webSocketQueryList: webSocketQueryList,
                    tableData: data
                })
            } else {
                this.setState({
                    tableData: data
                })
            }
            if (this.props.AfterGetSubmissionList !== undefined) {
                let Data: Submission[] = []
                for (const x of data) {
                    Data.push({
                        sid: x.submissionId,
                        JudgeResult: x.result,
                        Score: x.score,
                        Time: x.usedTime,
                        Memory: x.usedMemory,
                        JudgeTemplate: x.judgeTemplateTitle,
                        SubmitTime: x.submitTime,
                    })
                }
                this.props.AfterGetSubmissionList(Data)
            }
            if (IsMessage) message.success("刷新成功")
        })
    }

    componentDidMount() {
        if (this.state.ModalVis)
            this.updateList()
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (
            prevState.username !== this.state.username ||
            prevState.judgeResult !== this.state.judgeResult ||
            prevState.problemCode !== this.state.problemCode ||
            prevState.pageNow !== this.state.pageNow ||
            prevState.pageSize !== this.state.pageSize ||
            prevState.sortBy !== this.state.sortBy ||
            prevState.ascending !== this.state.ascending ||
            prevState.ModalVis !== this.state.ModalVis
        ) {
            this.updateList()
        }
    }

    onFinish = () => {
        const values = this.formRef.current?.getFieldsValue()
        this.setState({
            judgeResult: values.judgeResult,
            problemCode: values.problemCode,
            username: values.username
        })
    };

    onReset = () => {
        this.formRef.current!.resetFields();
        this.setState({
            judgeResult: undefined,
            problemCode: undefined,
            username: undefined
        })
    };

    render() {

        const columnsAll = [
            {
                title: "ID",
                dataIndex: "submissionId",
                key: "submissionId",
                render: (text: any, record: any) => {
                    return <a onClick={() => {
                        this.props.setNowExamId(this.props.examId)
                        this.props.setTopSubmission(record.submissionId, {
                            title: "",
                            TimeLimit: record.timeLimit,
                            MemoryLimit: record.memoryLimit,
                            sumScore: record.sumScore,
                            showScore: true
                        })
                        this.props.setSubmissionModalVis(true)
                    }}>
                        {text}
                    </a>
                }
            },
            {
                title: "用户名",
                dataIndex: "username",
                key: "username"
            },
            {
                title: "题目编号",
                dataIndex: "problemCode",
                key: "problemCode"
            },
            {
                title: "题目名",
                dataIndex: "problemTitle",
                key: "problemTitle"
            },
            {
                title: "结果",
                dataIndex: "result",
                key: "result",
                render: (text: any, record: any) => {
                    return <TestCase
                        type={"text"}
                        caseType={StateList.indexOf(SubmissionMap[text])}
                        append={text == "-2" ? "(" + record.RunningStep + "/" + record.checkpointNum + ")" : ""}
                    />
                }
            },
            {
                title: "得分",
                dataIndex: "score",
                key: "score",
                render: (text: number, record:any) => {
                    return text / record.sumScore * 100 + "%"
                }
            },
            {
                title: "评测模板",
                dataIndex: "judgeTemplateTitle",
                key: "judgeTemplateTitle"
            },
            {
                title: "内存使用",
                dataIndex: "usedMemory",
                key: "usedMemory",
                render: (text: any) => {
                    return text + " KB"
                }
            },
            {
                title: "时间使用",
                dataIndex: "usedTime",
                key: "usedTime",
                render: (text: any) => {
                    return text + " ms"
                }
            },
            {
                title: "提交时间",
                dataIndex: "submitTime",
                key: "submitTime",
                render: (text: any) => {
                    return moment(text).fromNow();
                }
            }
        ]
        return (
            <>
                <Button type={"link"} onClick={() => {
                    this.setState({ModalVis: true});
                }}>
                    评测列表
                </Button>
                <Modal
                    visible={this.state.ModalVis}
                    onCancel={() => this.setState({ModalVis: false})}
                    width={1250}
                    footer={false}
                >
                    <Card
                        title={
                            <Space>
                                提交记录
                                <SyncJudging
                                    open={this.state.webSocketOpen}
                                    dataHandle={this.addCaseInfo}
                                    queryList={this.state.webSocketQueryList}/>
                            </Space>

                        }
                        className={"Recent-submission"}
                        extra={
                            <Space>
                                <Button
                                    icon={<ReloadOutlined/>}
                                    onClick={() => {
                                        if (this.state.selectedRowsIndex.length === 0) {
                                            message.error("未选择任何项")
                                        } else {
                                            cApi.rejudge(this.state.selectedRowsIndex).then((resData) => {
                                                message.success("正在重测" + this.state.selectedRowsIndex.length + "个提交")
                                                this.setState({selectedRowsIndex: []})
                                                this.updateList()
                                            })
                                        }
                                    }}
                                >
                                    重测
                                </Button>
                                <Button
                                    icon={<ReloadOutlined/>}
                                    onClick={() => {
                                        this.setState({refreshDisable: true})
                                        this.updateList(true)
                                        setTimeout(() => {
                                            this.setState({refreshDisable: false})
                                        }, 3000)
                                    }}
                                    disabled={this.state.refreshDisable}
                                >
                                    刷新
                                </Button>
                            </Space>

                        }
                    >
                        <Form
                            ref={this.formRef}
                        >
                            <Space size={30}>
                                <Form.Item label={"用户名"} name={"username"}>
                                    <Input
                                        onPressEnter={(e: any) => {
                                            this.onFinish()
                                        }}
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item label={"题目编号"} name={"problemCode"}>
                                    <Input
                                        onPressEnter={(e: any) => {
                                            this.onFinish()
                                        }}
                                        allowClear
                                    />
                                </Form.Item>
                                <Form.Item label={"评测结果"} name={"judgeResult"}>
                                    <Select onChange={this.onFinish} allowClear style={{width: 200}}>
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
                            <Space style={{float: "right"}} size={20}>
                                <Button type="primary" onClick={this.onFinish}>
                                    筛选
                                </Button>
                                <Button htmlType="button" onClick={this.onReset}>
                                    重置
                                </Button>
                            </Space>
                        </Form>

                        <Table
                            size={"small"}
                            columns={columnsAll}
                            pagination={{
                                pageSize: this.state.pageSize,
                                hideOnSinglePage: true,
                                showQuickJumper: true,
                                showSizeChanger: true,
                                pageSizeOptions: ["15", "20", "30", "50", "80"],
                                onChange: (page, pageSize) => {
                                    this.setState({
                                        pageNow: page,
                                        pageSize: pageSize,
                                    })
                                },
                                total: this.state.total,
                            }}
                            dataSource={this.state.tableData}
                            rowKey={"submissionId"}
                            rowSelection={{
                                onChange: (selectedRowKeys, selectedRows) => {
                                    this.setState({selectedRowsIndex: selectedRowKeys})
                                },
                                selectedRowKeys: this.state.selectedRowsIndex
                            }}
                        />
                    </Card>
                </Modal>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        topSubmission: SubState.TopSubmissionId,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
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
)(withRouter(SubmissionList))