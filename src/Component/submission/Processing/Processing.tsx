import {Dispatch, useEffect, useState} from "react";
import {Skeleton, Steps} from 'antd';
import {withTranslation} from "react-i18next";
import {LoadingOutlined} from '@ant-design/icons';
import {TestCaseProp} from "../TestCase";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import {
    fileExtList2Lang,
    RunningResultType,
    RunningStateType,
    StateList,
    submissionInfoType,
    SubmissionMap,
    SubmissionState,
    TestCaseStates
} from "../../../Type/ISubmission";
import CodeHighlight from "../../common/CodeHighlight";
import {SyncJudging} from "../SyncJudging";
import {ck, isValueEmpty} from "../../../Utils/empty";
import Running from "./Running";
import Summary from "./Summary";
import cApi from "../../../Utils/API/c-api";

interface IProcessingProp {
    TimeLimit: number
    MemoryLimit: number,
}

const Processing = (props: IProcessingProp & any) => {

    // 当前评测的最新到达的步骤
    const [currentStep, setCurrentStep] = useState<number>(0)
    // 当前显示的步骤
    const [showStep, setShowStep] = useState<number>(0)

    // 评测有 评测进度 与 评测结果 两种
    // 评测进度
    const [RunningState, setRunningState] = useState<RunningStateType>("-4")
    // 评测结果
    const [RunningResult, setRunningResult] = useState<RunningResultType>("0")

    // 测试点当前评测状态
    const [TestCaseStateList, setTestCaseStateList] = useState<TestCaseProp[]>([])
    const [PublicTestCaseStateList, setPublicTestCaseStateList] = useState<TestCaseProp[]>([])

    // 测试结果信息
    const [submissionInfo, setSubmissionInfo] = useState<submissionInfoType | undefined>()

    // 为了动态显示评测点信息，使用 ws 与后端进行链接
    // ws 是否打开
    const [webSocketOpen, setWebSocketOpen] = useState<boolean>(false)
    // ws 发送的信息（在打开时，当前数据的变更将同步发送至 ws）
    const [webSocketQueryList, setWebSocketQueryList] = useState<string[]>([])

    const preDealCheckpointSet = (resData: any, key: string) => {
        if (resData[key] === null) resData[key] = []
        else {
            resData[key] = resData[key].map((value: any) => {
                return {
                    RunningResult: value[1].toString(),
                    Score: value[2],
                    Time: value[3],
                    Memory: value[4],
                    Index: value[0]
                }
            })
        }
    }
    const initCaseData = (data: TestCaseProp[], num: number) => {
        for (let i = 1; i <= num; i++) {
            data.push({
                caseIndex: i,
                caseType: TestCaseStates.Pending,
            })
        }
    }

    const setCaseValue = (resData: any, key: string, data: TestCaseProp[]) => {
        for (let i = 0; i < resData[key].length; i++) {
            data.push({
                caseIndex: i + 1,
                caseType: StateList.indexOf(SubmissionMap[resData[key][i].RunningResult.toString()]),
                caseScore: resData[key][i].Score,
                caseTime: resData[key][i].Time,
                caseMemory: resData[key][i].Memory,
                caseID: resData[key][i].Index
            })
        }
    }

    const getSubmissionInfo = () => {
        props.QuerySubmissionAPI(props.submissionId).then((resData: any) => {
            // 格式化当前测试点信息
            preDealCheckpointSet(resData, "checkpointResults")
            preDealCheckpointSet(resData, "publicCheckpointResults")

            // 根据当前的结果，初始化测试点信息，且调整当前布局
            // 分 3 类分别处理： 1. 未评测完   2. 已评测完，但结果是编译错误或系统错误   3. 已评测完
            let TestCaseInit: TestCaseProp[] = []
            let PublicTestCaseInit: TestCaseProp[] = []
            if (resData.judgeResult === 8 || resData.judgeResult === 5) {
                // 当前状态为 系统错误 或 编译错误
                setSubmissionInfo(resData)
                setCurrentStep(1)
                setShowStep(1)
                setRunningState("-1")
                setRunningResult(resData.judgeResult.toString())
            } else if (resData.judgeResult <= 0) { // resData.checkpointResults.length === 0
                // 当前还在等待状态
                initCaseData(TestCaseInit, resData.checkpointNum)
                initCaseData(PublicTestCaseInit, resData.publicCheckpointNum)

                setSubmissionInfo(resData)

                setTestCaseStateList(TestCaseInit)
                setPublicTestCaseStateList(PublicTestCaseInit)

                setCurrentStep(1)
                setShowStep(1)
                setRunningState(resData.judgeResult === 0 ? "-4" : resData.judgeResult.toString())
                setWebSocketOpen(true)
                setWebSocketQueryList([resData.submissionId])
            } else {
                // 当前状态为已完成评测
                setCaseValue(resData, "checkpointResults", TestCaseInit)
                setCaseValue(resData, "publicCheckpointResults", PublicTestCaseInit)

                // 评测已经结束后，当编译信息为空时，显示编译成功
                if (isValueEmpty(resData.judgeLog)) resData.judgeLog = props.t("CompileSuccess")
                setSubmissionInfo(resData)
                setTestCaseStateList(TestCaseInit)
                setPublicTestCaseStateList(PublicTestCaseInit)

                setCurrentStep(2)
                setShowStep(2)
                setRunningState("-1")
                setRunningResult(resData.judgeResult.toString())
            }
        })
    }

    useEffect(() => {
        if (props.submissionId !== undefined)
            getSubmissionInfo()
    }, [props.submissionId])


    const addCaseInfo = (data: any[]) => {
        const submissionIdHex = data[0]
        const submissionVersion = data[1]
        const checkpointType = data[2]
        const checkpointIndex = data[3]
        // const checkpointId = data[4]
        const judgeResult = data[5]
        const judgeScore = data[6]
        const usedTime = data[7]
        const usedMemory = data[8]

        // 若测试点信息，不是当前界面的，直接忽略
        if (submissionIdHex !== props.submissionId) return

        if (checkpointIndex < 0) {  // 小于 0，同步测试点状态
            setRunningState(checkpointIndex.toString())
            // -1 表示评测结束
            if (checkpointIndex === -1) {
                localStorage.setItem(`submissionVersion:${submissionIdHex}`, `${submissionVersion}`)
                getSubmissionInfo()
                setWebSocketOpen(false)
            }
        } else { // 否则表示同步测试点信息
            if (checkpointType === 0) {
                TestCaseStateList[checkpointIndex] = {
                    caseIndex: checkpointIndex + 1,
                    caseType: StateList.indexOf(SubmissionMap[judgeResult.toString()]),
                    caseScore: judgeScore,
                    caseTime: usedTime,
                    caseMemory: usedMemory
                }
                setTestCaseStateList([...TestCaseStateList])
            } else if (checkpointType === 1) {
                PublicTestCaseStateList[checkpointIndex] = {
                    caseIndex: checkpointIndex + 1,
                    caseType: StateList.indexOf(SubmissionMap[judgeResult.toString()]),
                    caseScore: judgeScore,
                    caseTime: usedTime,
                    caseMemory: usedMemory
                }
                setPublicTestCaseStateList([...PublicTestCaseStateList])
            }

        }
    }


    const {Step} = Steps;
    const nameList = ['code', "running", "summary"]

    const getStatus = (name: string) => {
        const res = parseInt(RunningResult)
        // "5": "System Error", "8": "Compilation Error", "99": "Canceled"
        if (name === "running" && (res === 99)) return "wait"
        if (name === "running" && (res === 5 || res === 8))
            return "error"
        const NameIndex = nameList.indexOf(name)
        if (currentStep === NameIndex) return "process";
        if (currentStep < NameIndex) return "wait";
        if (currentStep > NameIndex) return "finish";
    }
    const getDisabled = (name: string) => {
        return currentStep < nameList.indexOf(name);
    }
    const getIcon = (name: string) => {
        if (name === "running" && RunningResult === "99") return undefined
        // 若现在为正在运行的状态
        return (RunningState !== "-1" && currentStep === nameList.indexOf(name)) ?
            <LoadingOutlined/> : undefined
    }

    const sf = submissionInfo

    let steps: { [key: string]: any } = {
        code: {
            title: props.t("Code"),
            icon: getIcon("code"),
            status: getStatus("code"),
            disabled: getDisabled("code"),
            cssClass: "steps-content-pending",
            content: (
                <>
                    {!isValueEmpty(sf?.code) && sf?.judgeTemplateTitle !== undefined && (
                        <CodeHighlight code={sf?.code} lang={fileExtList2Lang(sf.judgeTemplate.acceptFileExtensions)}/>
                    )}
                    {isValueEmpty(sf?.zipFileId) && isValueEmpty(sf?.code) && (
                        props.t("codeIsNotPublic")
                    )}
                    {!isValueEmpty(sf?.zipFileId) && (
                        <a href={cApi.getFileDownloadUrl(sf?.zipFileId as string, Date.now().toString() + ".zip")}>{props.t("clickToDownload")}</a>
                    )}
                </>
            )
        },
        running: {
            title: props.t("run"),
            icon: getIcon("running"),
            status: getStatus("running"),
            disabled: getDisabled("running") || RunningResult === "99",
            cssClass: "steps-content-compile",
            content: (
                <Running
                    TestCaseStateList={TestCaseStateList}
                    PublicTestCaseStateList={PublicTestCaseStateList}
                    scoreMod={props.scoreMod}
                    testcaseMod={props.testcaseMod}
                    sumScore={props.sumScore}
                    RunningState={RunningState}
                    RunningResult={RunningResult}
                    submissionInfo={submissionInfo}
                    refresh={getSubmissionInfo}
                />
            )
        },
        summary: {
            title: props.t("Summary"),
            icon: getIcon("summary"),
            status: getStatus("summary"),
            disabled: getDisabled("summary"),
            cssClass: "steps-content-summary",
            content: (
                <Summary
                    TestCaseStateList={TestCaseStateList}
                    PublicTestCaseStateList={PublicTestCaseStateList}
                    scoreMod={props.scoreMod}
                    testcaseMod={props.testcaseMod}
                    sumScore={props.sumScore}
                    TimeLimit={ck(props.TimeLimit, sf?.timeLimit)}
                    MemoryLimit={ck(props.MemoryLimit, sf?.memoryLimit)}
                    submissionInfo={submissionInfo}
                    refresh={getSubmissionInfo}
                />
            )
        }
    }

    return (
        <>
            <div className={"Processing-SyncJudging"}>
                <SyncJudging
                    open={webSocketOpen}
                    dataHandle={addCaseInfo}
                    queryList={webSocketQueryList}/>
            </div>

            <Skeleton active loading={props.submissionId === undefined || sf === undefined}>
                <Steps type="navigation" current={showStep} onChange={setShowStep}>
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
                <div className={`steps-content ${steps[nameList[showStep]].cssClass}`}>
                    {steps[nameList[showStep]].content}
                </div>
            </Skeleton>
        </>
    )


}

const mapStateToProps = (state: any) => {
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        submissionId: SubState.TopSubmissionId,
        TimeLimit: SubState.TopSubmissionInfo?.TimeLimit,
        MemoryLimit: SubState.TopSubmissionInfo?.MemoryLimit,

        scoreMod: SubState.TopSubmissionInfo?.scoreMod,
        sumScore: SubState.TopSubmissionInfo?.sumScore,

        testcaseMod: SubState.TopSubmissionInfo?.testcaseMod,

        QuerySubmissionAPI: SubState.TopSubmissionInfo?.QuerySubmissionAPI
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(Processing)
    ))
