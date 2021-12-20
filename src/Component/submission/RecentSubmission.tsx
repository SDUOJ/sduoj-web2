import {Component, Dispatch} from "react";
import {Button, Card, message, Space, Table} from "antd";
import {ExamState, SProGroupInfo} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {getExamInfoTodo} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {withRouter} from "react-router-dom";
import {
    RunningResultType, RunningSubmissionInfo,
    StateList,
    SubmissionMap,
    SubmissionState,
    TopSubmissionInfoType
} from "../../Type/ISubmission";
import TestCase from "./TestCase";
import moment from "moment";
import {setTopSubmission} from "../../Redux/Action/submission";
import {ReloadOutlined} from "@ant-design/icons"
import {ProgramContent, Submission} from "../../Type/IProblem";
import {SyncJudging} from "./SyncJudging";

class RecentSubmission extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            tableData: [],
            refreshDisable: false,
            webSocketOpen: false,
            webSocketQueryList: []
        }
    }

    addCaseInfo = (data: any[]) => {
        if (data[1] < 0) {
            let dt = this.state.tableData
            const Index = dt.findIndex((value: any) => value.submissionId == data[0])
            if(Index == -1) return
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
            if(Index == -1) return
            if(dt[Index].RunningStep < data[1] + 1){
                dt[Index].RunningStep = data[1] + 1
                dt[Index].score += data[3]
            }
            this.setState({tableData: dt})
        }
    }

    updateList = (IsMessage: boolean = false) => {
        this.props.getSubmissionList(this.props.groupId, this.props.problemId).then((resData: any[]) => {
            let data: any = []
            if (resData === null) resData = []
            let webSocketQueryList = []
            for (const x of resData) {
                if (x.judgeResult <= 0) webSocketQueryList.push(x.submissionId)
                data.push({
                    checkpointNum: x.checkpointNum,
                    RunningStep: 0,
                    submissionId: x.submissionId,
                    result: x.judgeResult.toString(),
                    score: x.judgeScore,
                    submitTime: parseInt(x.gmtCreate),
                    judgeTemplateTitle: x.judgeTemplateTitle,
                    usedMemory: x.usedMemory,
                    usedTime: x.usedTime,
                })
            }
            data.reverse()
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
        if (this.props.show) this.updateList()
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.problemId != this.props.problemId
            || prevProps.groupId != this.props.groupId
            || prevProps.topSubmission != this.props.topSubmission
        ) {
            if (this.props.show) this.updateList()
        }
    }

    render() {
        const columns = [
            {
                title: "结果",
                dataIndex: "result",
                key: "result",
                render: (text: any, record: any) => {

                    return (
                        <TestCase
                            type={"text"}
                            caseType={StateList.indexOf(SubmissionMap[text])}
                            append={text == "-2" ? "(" + record.RunningStep + "/" + record.checkpointNum + ")" : ""}
                        />
                    )
                }
            },
            {
                title: "得分",
                dataIndex: "score",
                key: "score",
                render: (text: number) => {
                    return text / this.props.sumScore * 100 + "%"
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
        const columnsAll = [
            {
                title: "ID",
                dataIndex: "submissionId",
                key: "submissionId"
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
                render: (text: number) => {
                    return text / this.props.sumScore * 100 + "%"
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
            this.props.show && (
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
                    }
                >
                    <Table
                        size={"small"}
                        columns={this.props.pageSize === undefined ? columns : columnsAll}
                        pagination={{
                            pageSize: this.props.pageSize === undefined ? 5 : this.props.pageSize,
                            hideOnSinglePage: true,
                            showQuickJumper: true
                        }}
                        dataSource={this.state.tableData}
                        onRow={(record: any) => {
                            return {
                                onClick: (e: any) => {
                                    this.props.setTopSubmission(record.submissionId, {
                                        title: this.props.title,
                                        TimeLimit: this.props.Time,
                                        MemoryLimit: this.props.Memory,
                                        sumScore: this.props.sumScore
                                    })
                                    this.props.setSubmissionModalVis(true)
                                }
                            }
                        }}
                    />
                </Card>
            )
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const SubState: SubmissionState = state.SubmissionReducer
    let show = false
    if (State.ProListLoad) {
        if ((State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1].type == "Program") {
            show = true;
        }
    }
    let Memory: any = 0, Time: any = 0, title: any = "", sumScore: any = 100
    if (State.proGroupInfo != undefined) {
        const Pro = State.proGroupInfo[State.TopGroupIndex - 1].proList[State.TopProblemIndex - 1].content as ProgramContent
        Time = Pro?.TimeLimit
        Memory = Pro?.MemoryLimit
        title = Pro?.title
        sumScore = Pro?.SumScore
    }

    return {
        topSubmission: SubState.TopSubmissionId,
        show: show,
        problemId: State.TopProblemIndex - 1,
        groupId: State.TopGroupIndex - 1,
        Time: Time,
        Memory: Memory,
        title: title,
        sumScore: sumScore
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
)(withRouter(RecentSubmission))