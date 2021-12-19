import {Component, Dispatch} from "react";
import {Alert, Card, Col, Progress, Row, Skeleton, Statistic, Steps} from 'antd';
import {withTranslation} from "react-i18next";
import {LoadingOutlined} from '@ant-design/icons';
import TestCase, {TestCaseProp} from "./TestCase";
import Title from "antd/es/typography/Title";
import JudgeResult from "./JudgeResult";
import {examID} from "../../Type/types";
import {getExamInfoTodo} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {
    langMap,
    RunningResultType,
    RunningStateType, StateList,
    submissionInfoType, SubmissionMap,
    SubmissionState, TestCaseStates
} from "../../Type/ISubmission";
import {JudgeTemplate} from "../../Type/IProblem";
import CodeHighlight from "../common/CodeHighlight";
import {SyncJudging} from "./SyncJudging";
import {ClimbingBoxLoader, ClipLoader} from "react-spinners";


interface SProcessing {
    currentStep: number                 // 最新可展示步骤
    showStep: number                    // 当前展示的步骤
    RunningState: RunningStateType      // 运行时的状态
    RunningResult: RunningResultType    // 评测结束的状态
    TestCaseStateList: TestCaseProp[]   // 运行时测试点的状态
    submissionInfo?: submissionInfoType // 提交信息
    webSocketOpen: number              // ws 是否开启
    webSocketQueryList: string[]        // ws 请求列表
}

interface IProcessingProp {
    TimeLimit: number
    MemoryLimit: number,
}

class Processing extends Component<IProcessingProp & any, SProcessing> {

    constructor(props: any) {
        super(props);
        this.state = {
            currentStep: 0,
            showStep: 0,
            RunningState: "-4",
            RunningResult: "0",
            TestCaseStateList: [],
            webSocketOpen: -1,
            webSocketQueryList: []
        }
    }

    getSubmissionInfo = () => {
        this.props.QuerySubmission(this.props.submissionId).then((resData: any) => {
            resData.checkpointResults = resData.checkpointResults.map((value: any) => {
                return {
                    RunningResult: value[0].toString(),
                    Score: value[1],
                    Time: value[2],
                    Memory: value[3]
                }
            })
            if (this.state.RunningState == "-1" && (resData.judgeLog == null || resData.judgeLog.length === 0))
                resData.judgeLog = "编译成功"
            let TestCaseInit: TestCaseProp[] = []
            if (resData.judgeResult === 0) {
                this.setState({
                    submissionInfo: resData,
                    currentStep: 1,
                    showStep: 1,
                    RunningState: "-4",
                    webSocketOpen: Date.now(),
                    webSocketQueryList: [resData.submissionId]
                })
            } else if (resData.judgeResult === 8 || resData.judgeResult === 5) {
                this.setState({
                    submissionInfo: resData,
                    currentStep: 1,
                    showStep: 1,
                    RunningState: "-1",
                    RunningResult: resData.judgeResult.toString(),
                })
            } else if (resData.checkpointResults.length === 0) {
                for (let i = 1; i <= resData.checkpointNum; i++) {
                    TestCaseInit.push({
                        caseIndex: i,
                        caseType: TestCaseStates.Pending,
                    })
                }
                this.setState({
                    submissionInfo: resData,
                    TestCaseStateList: TestCaseInit,
                    currentStep: 1,
                    showStep: 1,
                    RunningState: resData.judgeResult.toString(),
                    webSocketOpen: Date.now(),
                    webSocketQueryList: [resData.submissionId]
                })
            } else {
                for (let i = 0; i < resData.checkpointResults.length; i++) {
                    TestCaseInit.push({
                        caseIndex: i,
                        caseType: StateList.indexOf(SubmissionMap[resData.checkpointResults[i].RunningResult.toString()]),
                        caseScore: resData.checkpointResults[i].Score,
                        caseTime: resData.checkpointResults[i].Time,
                        caseMemory: resData.checkpointResults[i].Memory
                    })
                }
                this.setState({
                    submissionInfo: resData,
                    TestCaseStateList: TestCaseInit,
                    currentStep: 2,
                    showStep: 2,
                    RunningState: "-1",
                    RunningResult: resData.judgeResult.toString(),
                })
            }
        })
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<SProcessing>, snapshot?: any) {
        if (this.props.submissionId != prevProps.submissionId) {
            this.getSubmissionInfo()
        }
    }

    componentDidMount() {
        if (this.props.submissionId != undefined) this.getSubmissionInfo()
    }

    addCaseInfo = (data: any[]) => {
        if (data[1] < 0) {
            this.setState({
                RunningState: data[1].toString()
            })
            if (data[1] == -1) {
                this.getSubmissionInfo()
            }
        } else {
            let TestCaseStateList = this.state.TestCaseStateList
            TestCaseStateList[data[1]] = {
                caseIndex: data[1],
                caseType: StateList.indexOf(SubmissionMap[data[2].toString()]),
                caseScore: data[3],
                caseTime: data[4],
                caseMemory: data[5]
            }
            this.setState({
                TestCaseStateList: TestCaseStateList
            })
        }
    }

    OnChange = (current: number) => {
        this.setState({showStep: current});
    };

    getCaseInfo = () => {
        let scoreAC = 0, scoreSum = 0, scoreAll = 0, mxTime: number = 0, mxMem: number = 0
        let SumTime = 0, SumMem = 0
        const Tcl = this.state.TestCaseStateList
        for (let i = 0; i < Tcl.length; i++) {
            // @ts-ignore
            const add: number = Tcl[i].caseScore === undefined ? 0 : Tcl[i].caseScore
            if (Tcl[i].caseType === TestCaseStates.Accepted) {
                scoreAC += add
                scoreSum += add
            } else if (Tcl[i].caseType === TestCaseStates.Pending
                || Tcl[i].caseType === TestCaseStates.Running) scoreSum += add
            scoreAll += add
            // @ts-ignore
            const caseTime: number = Tcl[i].caseTime === undefined ? 0 : Tcl[i].caseTime
            // @ts-ignore
            const caseMem: number = Tcl[i].caseMemory === undefined ? 0 : Tcl[i].caseMemory

            if (mxTime < caseTime) mxTime = caseTime
            if (mxMem < caseMem) mxMem = caseMem
            SumTime += caseTime
            SumMem += caseMem
        }
        return {
            AC: scoreAC, SumRunning: scoreSum, SumAll: this.props.SumScore,
            mxTime: mxTime, mxMem: mxMem, SumTime: SumTime, AvgMem: SumMem / Tcl.length
        }
    }

    render() {
        const {Step} = Steps;
        const nameList = ['code', "running", "summary"]

        const getStatus = (name: string) => {
            const res = parseInt(this.state.RunningResult)
            // "5": "System Error", "8": "Compilation Error",
            if (name === "running" && (res === 5 || res === 8))
                return "error"
            const NameIndex = nameList.indexOf(name)
            if (this.state.currentStep === NameIndex) return "process";
            if (this.state.currentStep < NameIndex) return "wait";
            if (this.state.currentStep > NameIndex) return "finish";
        }
        const getDisabled = (name: string) => {
            return this.state.currentStep < nameList.indexOf(name);
        }
        const getIcon = (name: string) => {
            // 若现在为正在运行的状态
            return (this.state.RunningState !== "-1" && this.state.currentStep === nameList.indexOf(name)) ?
                <LoadingOutlined/> : undefined
        }
        const info = this.getCaseInfo()
        const getRunningIcon = (w: RunningStateType) => {
            if (w === this.state.RunningState) return <LoadingOutlined/>
            return undefined
        }
        const getRunningState = (w: RunningStateType) => {
            if (this.state.RunningState === "-1" && this.state.RunningResult == "8") {
                if (w === "-4") return "finish"
                if (w === "-3") return "error"
                if (w === "-2") return "wait"
            } else if (this.state.RunningState === "-1" && this.state.RunningResult == "5") {
                if (w === "-4") return "finish"
                if (w === "-3") return "finish"
                if (w === "-2") return "error"
            } else {
                if (w === this.state.RunningState) return "process"
                if (parseInt(w) < parseInt(this.state.RunningState)) return "finish"
                return "wait"
            }
        }

        const sf = this.state.submissionInfo

        let steps: { [key: string]: any } = {
            code: {
                title: "代码",
                icon: getIcon("code"),
                status: getStatus("code"),
                disabled: getDisabled("code"),
                cssClass: "steps-content-pending",
                content: (
                    sf != undefined && (
                        <>
                            <CodeHighlight code={sf.code} lang={langMap[sf.judgeTemplateTitle]}/>
                        </>
                    )
                )
            },
            running: {
                title: "运行",
                icon:
                    getIcon("running"),
                status: getStatus("running"),
                disabled: getDisabled("running"),
                cssClass: "steps-content-compile",
                content:
                    (
                        <>
                            <Steps>
                                <Step status={getRunningState("-4")} title="Queueing" icon={getRunningIcon("-4")}/>
                                <Step status={getRunningState("-3")} title="Compiling" icon={getRunningIcon("-3")}/>
                                <Step status={getRunningState("-2")} title="Judging" icon={getRunningIcon("-2")}/>
                            </Steps>
                            <div style={{marginTop: "30px"}}>
                                {
                                    [""].map(() => {
                                        if (this.state.submissionInfo != undefined) {
                                            if (this.state.submissionInfo.judgeLog != null &&
                                                this.state.submissionInfo.judgeLog.length !== 0) {
                                                switch (this.state.RunningResult) {
                                                    case "8":
                                                        return (<Alert message={this.props.t("CompileFailed")}
                                                                       description={this.state.submissionInfo.judgeLog}
                                                                       type="error" showIcon/>)
                                                    case "5":
                                                        return (<Alert message={this.props.t("SystemError")}
                                                                       description={this.state.submissionInfo.judgeLog}
                                                                       type="error" showIcon/>)
                                                    default:
                                                        return (<Alert message={"评测日志"}
                                                                       description={this.state.submissionInfo.judgeLog}
                                                                       type="warning" showIcon/>)
                                                }
                                            }
                                        }
                                    })
                                }
                            </div>
                            <div style={{marginTop: "30px"}}>
                                {
                                    (this.state.RunningState === "-4" || this.state.RunningState === "-3")
                                    && (
                                        <div style={{textAlign: "center", paddingTop:"100px"}}>
                                            <ClimbingBoxLoader color={"#99CCFF"} loading={true} size={15} />
                                            <div style={{marginTop:"50px"}}>排队中，请稍后...</div>
                                        </div>
                                    )
                                }
                            </div>
                            <div style={{marginTop: "30px"}}>
                                {
                                    this.state.RunningState === "-2" && (
                                        <>
                                            <Title level={4}> {this.props.t("CurrentScore")} </Title>
                                            <Title level={5}> {info.AC} </Title>
                                        </>
                                    )
                                }
                            </div>
                            <div style={{marginTop: "30px"}}>
                                {
                                    (this.state.RunningState === "-2" || this.state.RunningState === "-1") && (
                                        [''].map(() => {
                                            return (
                                                <>
                                                    <Title level={4}> {this.props.t("TestCaseInfo")} </Title>
                                                    {
                                                        this.state.TestCaseStateList.map((value) => {
                                                            return <TestCase {...value} />
                                                        })
                                                    }
                                                </>
                                            )
                                        })
                                    )
                                }
                            </div>
                        </>
                    )
            },
            summary: {
                title: this.props.t("Summary"),
                icon: getIcon("summary"),
                status: getStatus("summary"),
                disabled: getDisabled("summary"),
                cssClass: "steps-content-summary",
                content: (
                    <>
                        <Title level={4}> {this.props.t("Statistics")}</Title>
                        <Card size="small"
                              title={this.props.t("Overview")}
                              className={"card"}>
                            {
                                [''].map(() => {
                                    return (
                                        <Row>
                                            <Col className={"Progress-set"} span={6}>
                                                <Progress
                                                    success={{percent: info.AC / info.SumAll * 100}}
                                                    type="dashboard"
                                                    format={() => `${info.AC} / ${info.SumAll}`}
                                                />
                                                <span>{this.props.t("TotalScore")}</span>
                                            </Col>
                                            <Col className={"Progress-set"} span={6}>
                                                {
                                                    [''].map(() => {
                                                        if (info.mxTime > this.props.TimeLimit) {
                                                            return (
                                                                <Progress
                                                                    percent={100}
                                                                    type="dashboard" status="exception"
                                                                    format={() => `${info.mxTime} / ${this.props.TimeLimit} ms`}
                                                                />
                                                            )
                                                        } else {
                                                            return (
                                                                <Progress
                                                                    success={{percent: info.mxTime / this.props.TimeLimit * 100}}
                                                                    type="dashboard"
                                                                    format={() => `${info.mxTime} / ${this.props.TimeLimit} ms`}
                                                                />
                                                            )
                                                        }
                                                    })
                                                }
                                                <span>{this.props.t("MaximumTime")}</span>
                                            </Col>
                                            <Col className={"Progress-set"} span={6}>
                                                {
                                                    [''].map(() => {
                                                        if (info.mxMem > this.props.MemoryLimit) {
                                                            return (
                                                                <>
                                                                    <Progress
                                                                        percent={100}
                                                                        type="dashboard" status="exception"
                                                                        format={() => `${Math.floor(info.mxMem / 1024)} / ${Math.floor(this.props.MemoryLimit / 1024)} MB`}
                                                                    />
                                                                </>

                                                            )
                                                        } else {
                                                            return (
                                                                <Progress
                                                                    success={{percent: info.mxMem / this.props.MemoryLimit * 100}}
                                                                    type="dashboard"
                                                                    format={() => `${Math.floor(info.mxMem / 1024)} / ${Math.floor(this.props.MemoryLimit / 1024)} MB`}
                                                                />
                                                            )
                                                        }
                                                    })
                                                }
                                                <span>{this.props.t("MaximumMemory")}</span>
                                            </Col>
                                            <Col className={"Progress-set-Statistic"} span={6}>
                                                <Statistic title={this.props.t("TotalRunningTime")}
                                                           value={info.SumTime}
                                                           suffix="ms"/>
                                                <Statistic className={"Progress-set-Statistic-cell"}
                                                           title={this.props.t("AvgMemory")}
                                                           value={Math.floor(info.AvgMem / 1024)}
                                                           suffix="MB"/>
                                            </Col>
                                        </Row>
                                    )
                                })
                            }
                        </Card>
                        <Title level={4}> {this.props.t("JudgeResult")}</Title>
                        <JudgeResult data={this.state.TestCaseStateList} sumScore={this.props.SumScore}/>
                    </>
                )
            }


        }

        return (
            <>
                <div className={"Processing-SyncJudging"}>
                    <SyncJudging
                        running={this.state.webSocketOpen}
                        dataHandle={this.addCaseInfo}
                        queryList={this.state.webSocketQueryList}/>
                </div>

                <Skeleton active loading={this.props.submissionId == undefined || sf == undefined}>
                    {
                        this.props.submissionId !== undefined && sf !== undefined && (
                            <>
                                <Steps type="navigation" current={this.state.showStep} onChange={this.OnChange}>
                                    {
                                        nameList.map((name) => {
                                            return <Step
                                                title={steps[name].title}
                                                icon={steps[name].icon}
                                                status={steps[name].status}
                                                disabled={steps[name].disabled}
                                            />
                                        })
                                    }
                                </Steps>
                                <div className={`steps-content ${steps[nameList[this.state.showStep]].cssClass}`}>
                                    {steps[nameList[this.state.showStep]].content}
                                </div>
                            </>
                        )
                    }
                </Skeleton>
            </>
        )
    }

}

const mapStateToProps = (state: any) => {
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        submissionId: SubState.TopSubmissionId,
        TimeLimit: SubState.TopSubmissionInfo?.TimeLimit,
        MemoryLimit: SubState.TopSubmissionInfo?.MemoryLimit,
        SumScore: SubState.TopSubmissionInfo?.sumScore
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getExamInfo: (eid: examID) => dispatch(getExamInfoTodo(eid))

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(Processing)
    ))