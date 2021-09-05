import {Component} from "react";
import {Alert, Card, Col, Progress, Row, Spin, Statistic, Steps} from 'antd';
import {WithTranslation, withTranslation} from "react-i18next";

import {LoadingOutlined} from '@ant-design/icons';
import TestCase, {TestCaseProp, TestCaseStates} from "./TestCase";
import Title from "antd/es/typography/Title";
import JudgeResult from "./JudgeResult";


enum CompileStates {
    Waiting,
    Compiling,
    Success,
    Warning,
    Failed,
    SystemError
}

interface SProcessing {
    currentStep: number
    showStep: number
    PendingNumberInit: number
    PendingNumberLeft: number
    CompileState: CompileStates
    CompileMessage: string
    IsRunning: boolean
    TestCaseStateList: TestCaseProp[],
    OkTestCase: number
}

interface IProcessingProp extends WithTranslation {
    TestCaseNumber: number
    TimeLimit: number
    MemoryLimit: number,
    TestCaseScore: number[]
}

class Processing extends Component<IProcessingProp, SProcessing> {

    cnt: number = 0
    infoList: any

    flag: boolean = false

    constructor(props: Readonly<IProcessingProp> | IProcessingProp) {
        super(props);

        let TestCaseInit: TestCaseProp[] = []
        for (let i = 1; i <= this.props.TestCaseNumber; i++) {
            TestCaseInit.push({
                caseIndex: i,
                caseType: TestCaseStates.Pending,
                caseScore: this.props.TestCaseScore[i - 1]
            })
        }

        this.state = {
            IsRunning: true,
            currentStep: 0,
            showStep: 0,
            PendingNumberInit: -1,
            PendingNumberLeft: 0,
            CompileState: CompileStates.Waiting,
            CompileMessage: "",
            TestCaseStateList: TestCaseInit,
            OkTestCase: 0
        }

        this.infoList = [
            [0, 6],
            [0, 5],
            [0, 4],
            [0, 3],
            [0, 2],
            [0, 1],
            [0, 0],
            // 1 改变状态
            [1, 1], // 1 编译中
            [1, 2],
            // "\"solution.cc: In function 'int main()':\\n\" +\n" +
            // "            \"solution.cc:22:9: error: 'sortList' was not declared in this scope\\n\" +\n" +
            // "            \"  list = sortList(list);\\n\" +\n" +
            // "            \"         ^~~~~~~~\\n\" +\n" +
            // "            \"solution.cc:22:9: note: suggested alternative: 'sort'\\n\" +\n" +
            // "            \"  list = sortList(list);\\n\" +\n" +
            // "            \"         ^~~~~~~~\\n\" +\n" +
            // "            \"         sort\""], // 2 编译成功 3 编译带有警告  4 编译失败  5 系统错误
            // [1, 5],
            // 2 测试点信息
            [2, 1, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 2, TestCaseStates.WrongAnswer, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 3, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 4, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 5, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 6, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 50), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 7, TestCaseStates.Accepted, 50 + Math.floor(Math.random() * 50), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 8, TestCaseStates.RuntimeError, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 9, TestCaseStates.RuntimeError, 200 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 10, TestCaseStates.Accepted, 250 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 500)], // index, score, 状态， 时间， 内存
            [2, 11, TestCaseStates.OutputLimitExceeded, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 50000)], // index, score, 状态， 时间， 内存
            [2, 12, TestCaseStates.RuntimeError, 50 + Math.floor(Math.random() * 500), 25 * 1024 + Math.floor(Math.random() * 5000)], // index, score, 状态， 时间， 内存
        ]

        /*
        "solution.cc: In function 'int main()':\n" +
                    "solution.cc:22:9: error: 'sortList' was not declared in this scope\n" +
                    "  list = sortList(list);\n" +
                    "         ^~~~~~~~\n" +
                    "solution.cc:22:9: note: suggested alternative: 'sort'\n" +
                    "  list = sortList(list);\n" +
                    "         ^~~~~~~~\n" +
                    "         sort"
        * */

        setInterval(() => {
            if (this.cnt < 8) {
                const tpp = this.infoList[this.cnt][0]
                if (tpp === 0) this.addNewState(this.infoList[this.cnt][1])
                else if (tpp === 1) this.addNewState(undefined, this.infoList[this.cnt][1], this.infoList[this.cnt][2])
                else if (tpp === 2) this.addNewState(undefined, undefined, undefined, {
                    caseIndex: this.infoList[this.cnt][1],
                    caseType: this.infoList[this.cnt][2],
                    caseTime: this.infoList[this.cnt][3],
                    caseMemory: this.infoList[this.cnt][4]
                })
                this.cnt += 1
            } else if (!this.flag) {
                this.flag = true
                setInterval(() => {
                    if (this.cnt < this.infoList.length) {
                        const tpp = this.infoList[this.cnt][0]
                        if (tpp === 0) this.addNewState(this.infoList[this.cnt][1])
                        else if (tpp === 1) this.addNewState(undefined, this.infoList[this.cnt][1], this.infoList[this.cnt][2])
                        else if (tpp === 2) this.addNewState(undefined, undefined, undefined, {
                            caseIndex: this.infoList[this.cnt][1],
                            caseType: this.infoList[this.cnt][2],
                            caseTime: this.infoList[this.cnt][3],
                            caseMemory: this.infoList[this.cnt][4]
                        })

                        this.cnt += 1
                    }
                }, 1000)
            }
        }, 1000)


    }

    addNewState = (pending?: number,
                   nowStatus?: TestCaseStates,
                   compileInfo?: string,
                   testCase?: TestCaseProp
    ) => {
        if (pending !== undefined) {
            if (this.state.PendingNumberInit === -1)
                this.setState({
                    PendingNumberInit: pending + 1,
                    PendingNumberLeft: pending
                })
            else {
                this.setState({
                    PendingNumberLeft: pending
                })
            }
        }
        if (nowStatus !== undefined) {
            if (nowStatus === 1) {
                this.setState({
                    currentStep: 1,
                    showStep: 1,
                    CompileState: CompileStates.Compiling
                })
            } else if (nowStatus === 2) {
                this.setState({
                    CompileState: CompileStates.Success
                })
                setTimeout(() => {
                    this.setState((state) => {
                        return {
                            currentStep: Math.max(2, state.currentStep),
                            showStep: Math.max(2, state.showStep),
                        }
                    })
                }, this.state.OkTestCase <= 4 ? 1000 : 0)
            } else if (nowStatus === 3) {
                this.setState({
                    CompileState: CompileStates.Warning
                })
                setTimeout(() => {
                    this.setState((state) => {
                        return {
                            currentStep: Math.max(2, state.currentStep),
                            showStep: Math.max(2, state.showStep),
                        }
                    })
                }, this.state.OkTestCase <= 4 ? 1000 : 0)
            } else if (nowStatus === 4) {
                this.setState({
                    currentStep: 1,
                    showStep: 1,
                    CompileState: CompileStates.Failed,
                    IsRunning: false
                })
            } else if (nowStatus === 5) {
                this.setState({
                    currentStep: 1,
                    showStep: 1,
                    CompileState: CompileStates.SystemError,
                    IsRunning: false
                })
            }
        }
        if (compileInfo !== undefined) {
            this.setState({
                CompileMessage: compileInfo
            })
        }
        if (testCase !== undefined) {
            this.setState((state) => {
                // @ts-ignore
                testCase.caseScore = state.TestCaseStateList[testCase.caseIndex - 1].caseScore
                // @ts-ignore
                state.TestCaseStateList[testCase.caseIndex - 1] = testCase
                if (testCase.caseIndex !== this.props.TestCaseNumber) {
                    // @ts-ignore
                    state.TestCaseStateList[testCase.caseIndex].caseType = TestCaseStates.Running
                }
                return {
                    TestCaseStateList: state.TestCaseStateList,
                    OkTestCase: state.OkTestCase + 1
                }
            })
            if (testCase.caseIndex === this.props.TestCaseNumber) {
                setTimeout(() => {
                    this.setState({
                        IsRunning: false,
                        currentStep: 3,
                        showStep: 3
                    })
                }, 500)
            }
        }
    }


    OnChange = (current: number) => {
        this.setState({showStep: current});
    };

    render() {
        const {Step} = Steps;
        const nameList = ['pending', "compile", "evaluation", "summary"]

        const getStatus = (name: string) => {
            if (name === "compile"
                && (this.state.CompileState === CompileStates.Failed
                    || this.state.CompileState === CompileStates.SystemError))
                return "error"

            // if(!this.state.IsRunning) return "finish"

            const NameIndex = nameList.indexOf(name)
            if (this.state.currentStep === NameIndex) return "process";
            if (this.state.currentStep < NameIndex) return "wait";
            if (this.state.currentStep > NameIndex) return "finish";
        }
        const getDisabled = (name: string) => {
            return this.state.currentStep < nameList.indexOf(name);
        }
        const getIcon = (name: string) => {
            return (this.state.IsRunning && this.state.currentStep === nameList.indexOf(name)) ?
                <LoadingOutlined/> : undefined
        }
        const getCompileMessage = () => {
            if (this.state.CompileMessage.length === 0) {
                return this.props.t('NoMoreInfo')
            } else return (
                <pre>
                    {this.state.CompileMessage}
                </pre>

            )
        }
        const getCaseInfo = () => {
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
                AC: scoreAC, SumRunning: scoreSum, SumAll: scoreAll,
                mxTime: mxTime, mxMem: mxMem, SumTime: SumTime, AvgMem: SumMem / Tcl.length
            }
        }

        const info = getCaseInfo()
        let steps: { [key: string]: any } = {
            pending: {
                title: this.props.t("Pending"),
                icon: getIcon("pending"),
                status: getStatus("pending"),
                disabled: getDisabled("pending"),
                cssClass: "steps-content-pending",
                content: (
                    <>
                        <Spin tip={this.props.t("Loading")}
                              spinning={this.state.PendingNumberInit === -1}
                              className={"steps-content-compile-spin"}>
                            {
                                [''].map(() => {
                                    if (this.state.PendingNumberInit === -1) return <></>
                                    if (this.state.PendingNumberLeft === 0) {
                                        return <Progress type="circle" percent={100}
                                                         format={() => this.props.t("Done")}/>
                                    } else {
                                        return <Progress
                                            className={"Progress-pending"}
                                            type="circle"
                                            percent={this.state.PendingNumberLeft * 100 / this.state.PendingNumberInit}
                                            format={() => `${this.props.t("HaiYou")}${this.state.PendingNumberLeft} ${this.props.t("submissionLeft")}`}/>
                                    }
                                })
                            }
                        </Spin>
                    </>
                )
            },
            compile: {
                title: this.props.t("Compile"),
                icon: getIcon("compile"),
                status: getStatus("compile"),
                disabled: getDisabled("compile"),
                cssClass: "steps-content-compile",
                content: (
                    <>
                        <Spin tip={this.props.t("Compiling")}
                              spinning={this.state.CompileState === CompileStates.Compiling}
                              className={"steps-content-compile-spin"}>
                            {
                                [""].map(() => {
                                    switch (this.state.CompileState) {
                                        case CompileStates.Success:
                                            return (<Alert message={this.props.t("CompileSuccess")}
                                                           description={getCompileMessage()}
                                                           type="success" showIcon/>)
                                        case CompileStates.Failed:
                                            return (<Alert message={this.props.t("CompileFailed")}
                                                           description={getCompileMessage()}
                                                           type="error" showIcon/>)
                                        case CompileStates.SystemError:
                                            return (<Alert message={this.props.t("SystemError")}
                                                           description={this.props.t("CallAdmin")}
                                                           type="error" showIcon/>)
                                        case CompileStates.Warning:
                                            return (<Alert message={this.props.t("CompileSuccessWithWarning")}
                                                           description={getCompileMessage()}
                                                           type="warning" showIcon/>)
                                    }
                                })
                            }
                        </Spin>
                    </>
                )
            },
            evaluation: {
                title: this.props.t("Evaluation"),
                icon: getIcon("evaluation"),
                status: getStatus("evaluation"),
                disabled: getDisabled("evaluation"),
                cssClass: "steps-content-evaluation",
                content: (
                    <>
                        {
                            [''].map(() => {
                                if (this.state.IsRunning) {
                                    return (
                                        <>
                                            <Title level={3}> {this.props.t("CurrentScore")} </Title>
                                            <Title level={5}> {info.AC} / {info.SumRunning} </Title>
                                        </>
                                    )
                                }

                            })
                        }

                        <Title level={3}> {this.props.t("TestCaseInfo")} </Title>
                        {
                            this.state.TestCaseStateList.map((value) => {
                                return <TestCase {...value} />
                            })
                        }
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
                        <Title level={3}> {this.props.t("Statistics")}</Title>
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
                                                        if (info.mxTime > this.props.TimeLimit) {
                                                            return (
                                                                <Progress
                                                                    percent={100}
                                                                    type="dashboard" status="exception"
                                                                    format={() => `${Math.floor(info.mxMem / 1024)} / ${Math.floor(this.props.MemoryLimit / 1024)} MB`}
                                                                />
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
                                                <Statistic title={this.props.t("TotalRunningTime")} value={info.SumTime} suffix="ms"/>
                                                <Statistic className={"Progress-set-Statistic-cell"}
                                                           title={this.props.t("AvgMemory")} value={Math.floor(info.AvgMem / 1024)}
                                                           suffix="MB"/>
                                            </Col>
                                        </Row>

                                    )
                                })
                            }
                        </Card>
                        <Title level={3}> {this.props.t("JudgeResult")}</Title>
                        <JudgeResult type={"Sample"} data={this.state.TestCaseStateList}/>
                        <JudgeResult type={"Test"} data={this.state.TestCaseStateList}/>
                    </>
                )
            }


        }

        return (
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

}

export default withTranslation()(Processing)