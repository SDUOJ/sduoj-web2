import {withTranslation} from "react-i18next";
import {Alert, Progress, Steps} from "antd";
import {ClimbingBoxLoader} from "react-spinners";
import Title from "antd/es/typography/Title";
import {RunningStateType, SubmissionState, TestCaseStates} from "../../../Type/ISubmission";
import TestCase from "../TestCase";
import {LoadingOutlined} from "@ant-design/icons";
import {isValueEmpty} from "../../../Utils/empty";
import cApi from "../../../Utils/API/c-api";
import ReJudge from "../Func/ReJudge";
import judgeAuth from "../../../Utils/judgeAhtu";
import {connect} from "react-redux";
import {UserState} from "../../../Type/Iuser";
import {Dispatch} from "react";

const Running = (props: any) => {
    const {Step} = Steps
    const {RunningState, RunningResult, submissionInfo, TestCaseStateList, scoreMod, testcaseMod} = props
    const getRunningIcon = (w: RunningStateType) => {
        if (w === RunningState) return <LoadingOutlined/>
        return undefined
    }
    const getRunningState = (w: RunningStateType) => {
        // 处理编译错误
        if (RunningState === "-1" && RunningResult === "8") {
            if (w === "-4") return "finish"
            if (w === "-3") return "error"
            if (w === "-2") return "wait"
            // 处理系统错误
        } else if (RunningState === "-1" && RunningResult === "5") {
            if (w === "-4") return "finish"
            if (w === "-3") return "finish"
            if (w === "-2") return "error"
        } else {
            if (w === RunningState) return "process"
            if (parseInt(w) < parseInt(RunningState)) return "finish"
            return "wait"
        }
    }
    const getACScore = () => {
        let scoreAC = 0
        const Tcl = TestCaseStateList
        for (let i = 0; i < Tcl.length; i++) {
            const add: number = Tcl[i].caseScore === undefined ? 0 : Tcl[i].caseScore
            if (Tcl[i].caseType === TestCaseStates.Accepted) scoreAC += add
        }
        return scoreAC
    }
    return (
        <>
            <Steps>
                <Step status={getRunningState("-4")} title="Queueing" icon={getRunningIcon("-4")}/>
                <Step status={getRunningState("-3")} title="Compiling" icon={getRunningIcon("-3")}/>
                <Step status={getRunningState("-2")} title="Judging" icon={getRunningIcon("-2")}/>
            </Steps>

            {/*
                显示评测 log
            */}
            <div style={{marginTop: "30px"}}>
                {[""].map(() => {
                    if (submissionInfo !== undefined) {
                        if (!isValueEmpty(submissionInfo.judgeLog)) {
                            let obj: {
                                message: string,
                                type: "error" | "info" | "success" | "warning" | undefined
                            }
                            if (RunningResult === "8") obj = {message: props.t("CompileFailed"), type: "error"}
                            else if (RunningResult === "5") obj = {message: props.t("SystemError"), type: "error"}
                            else obj = {message: "评测日志", type: "info"}
                            return (
                                <Alert
                                    description={<pre className="preAutoLine">{submissionInfo.judgeLog}</pre>}
                                    showIcon={true}
                                    {...obj}
                                />
                            )
                        }
                    }
                })}
            </div>

            {judgeAuth(props.roles, ["admin", "superadmin"])
                && (RunningState !== "-4" && RunningState !== "-3" && RunningState !== "-2") &&
                (
                    <div style={{marginTop: "30px"}}>
                        <ReJudge
                            API={props.RejudgeAPI ?? cApi.rejudge}
                            data={[submissionInfo.submissionId]}
                            afterSuccess={props.refresh}
                        />
                    </div>
                )}

            {/*
                排队中的提示
            */}
            <div style={{marginTop: "30px"}}>
                {(RunningState === "-4" || RunningState === "-3") && (
                    <div style={{textAlign: "center", paddingTop: "100px"}}>
                        <ClimbingBoxLoader color={"#99CCFF"} loading={true} size={15}/>
                        <div style={{marginTop: "50px"}}>
                            {RunningState === "-4" && (<>排队中，请稍后...</>)}
                            {RunningState === "-3" && (<>编译中，请稍后...</>)}
                        </div>
                    </div>
                )}
            </div>

            {/*
                当前获得的分数
            */}
            <div style={{marginTop: "30px"}}>
                {
                    RunningState === "-2" && scoreMod === "show" && (
                        <>
                            <Title level={4}> {props.t("CurrentScore")} </Title>
                            <Title level={5}> {getACScore()} </Title>
                        </>
                    )
                }
            </div>

            {/*
                显示评测进度
            */}
            <div style={{marginTop: "30px"}}>
                {
                    RunningResult !== "8" &&
                    RunningResult !== "5" &&
                    testcaseMod !== "show" && (
                        [''].map(() => {
                            let JudgedNum = 0
                            for (const x of TestCaseStateList) {
                                if (x.caseType !== TestCaseStates.Pending) JudgedNum += 1
                            }
                            return (
                                <>
                                    <Title level={4}> 测试进度 </Title>
                                    <div style={{textAlign: "center"}}>
                                        <Progress
                                            percent={JudgedNum / TestCaseStateList.length * 100}
                                            type="dashboard" status="normal"
                                            format={() => {
                                                return (
                                                    <span style={{fontSize: 18}}>
                                                        {Math.floor(JudgedNum / TestCaseStateList.length * 100)} / 100%
                                                    </span>
                                                )
                                            }}
                                        />
                                    </div>
                                </>
                            )
                        })
                    )
                }
            </div>

            {/*
                显示测试点详细信息
            */}
            <div style={{marginTop: "30px"}}>
                {
                    (RunningState === "-2" || RunningState === "-1") &&     // 已经到达了测试点阶段
                    RunningResult !== "8" && RunningResult !== "5" &&       // 不是编译错误或系统错误
                    testcaseMod === "show" && TestCaseStateList.length !== 0 && (                             // 测试点设置为可显示
                        [''].map(() => {
                            return (
                                <>
                                    <Title level={4}> {props.t("TestCaseInfo")} </Title>
                                    {
                                        TestCaseStateList.map((value: any) => {
                                            return <TestCase {...value} scoreMod={scoreMod}/>
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
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const SubState: SubmissionState = state.SubmissionReducer

    return {
        roles: UState.userInfo?.roles,
        RejudgeAPI: SubState.TopSubmissionInfo?.RejudgeAPI,
        InvalidateAPI: SubState.TopSubmissionInfo?.InvalidateAPI
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(Running))