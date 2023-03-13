import {withTranslation} from "react-i18next";
import Title from "antd/es/typography/Title";
import {Card, Col, Progress, Row, Space, Statistic, Table} from "antd";
import JudgeResult from "./JudgeResult";
import {StateList, SubmissionMap, SubmissionState, TestCaseStates} from "../../../Type/ISubmission";
import {unix2Time} from "../../../Utils/Time";
import TestCase from "../TestCase";
import cApi from "../../../Utils/API/c-api";
import ReJudge from "../Func/ReJudge";
import Invalidate from "../Func/Invalidate";
import DownloadTestCase from "../Func/DownloadTestCase";
import {connect} from "react-redux";
import {UserState} from "../../../Type/Iuser";
import {Dispatch} from "react";
import judgeAuth from "../../../Utils/judgeAhtu";

const Summary = (props: any) => {
    const {TestCaseStateList, submissionInfo, PublicTestCaseStateList} = props
    const getCaseInfo = () => {
        let scoreAC = 0, scoreSum = 0, mxTime: number = 0, mxMem: number = 0
        let SumTime = 0, SumMem = 0, firstUnACCaseNumber = undefined
        const Tcl = TestCaseStateList
        for (let i = 0; i < Tcl.length; i++) {
            const add: number = Tcl[i].caseScore === undefined ? 0 : Tcl[i].caseScore
            // 找到第一个没有 AC 的测试点
            if (firstUnACCaseNumber === undefined && Tcl[i].caseType !== TestCaseStates.Accepted)
                firstUnACCaseNumber = i + 1
            if (Tcl[i].caseType === TestCaseStates.Accepted) {
                scoreAC += add
                scoreSum += add
            } else if (Tcl[i].caseType === TestCaseStates.Pending
                || Tcl[i].caseType === TestCaseStates.Running) scoreSum += add
            // scoreAll += add
            const caseTime: number = Tcl[i].caseTime === undefined ? 0 : Tcl[i].caseTime
            const caseMem: number = Tcl[i].caseMemory === undefined ? 0 : Tcl[i].caseMemory

            if (mxTime < caseTime) mxTime = caseTime
            if (mxMem < caseMem) mxMem = caseMem
            SumTime += caseTime
            SumMem += caseMem
        }
        return {
            AC: scoreAC, SumRunning: scoreSum, SumAll: props.sumScore,
            mxTime: mxTime, mxMem: mxMem, SumTime: SumTime, AvgMem: SumMem / Tcl.length,
            firstUnACCaseNumber: firstUnACCaseNumber
        }
    }
    const info = getCaseInfo()
    return (
        <>
            <Title level={4}> {props.t("Overview")}</Title>
            <Row style={{marginBottom: 20}}>
                <Col span={11}>
                    <Card size={"small"}
                          title={<span style={{fontWeight: "bold"}}>{props.t("judgingInformation")}</span>}>
                        <Table
                            size={"small"}
                            pagination={false}
                            dataSource={[
                                {
                                    key: props.t("conclusion"),
                                    value: (
                                        <Space>
                                            <TestCase
                                                type={"text"}
                                                caseType={StateList.indexOf(SubmissionMap[submissionInfo.judgeResult])}
                                            />
                                            {props.testcaseMod !== "disable" &&
                                                info.firstUnACCaseNumber !== undefined &&
                                                submissionInfo.judgeResult !== 99 && (
                                                    <span>
                                                    ({props.t("OnTestCase")}{info.firstUnACCaseNumber})
                                                </span>
                                                )}
                                        </Space>
                                    )
                                },
                                {key: props.t("index"), value: submissionInfo.submissionId},
                                {key: props.t("submissionTime"), value: unix2Time(submissionInfo.gmtCreate)},
                                {key: props.t("judgingTime"), value: unix2Time(submissionInfo.gmtModified)},
                                {key: props.t("template"), value: submissionInfo.judgeTemplateTitle},
                            ]}
                            showHeader={false}
                            columns={[
                                {dataIndex: "key"},
                                {dataIndex: "value"}
                            ]}
                        />
                    </Card>
                </Col>
                <Col span={12} offset={1}>
                    <Card size={"small"}
                          title={<span style={{fontWeight: "bold"}}>{props.t("affiliateInformation")}</span>}>
                        <Table
                            size={"small"}
                            pagination={false}
                            dataSource={[
                                {
                                    key: props.t("submitUser"),
                                    value: submissionInfo.username + " (ID: " + submissionInfo.userId + ")"
                                },
                                {
                                    key: props.t("problemInformation"),
                                    value: submissionInfo.problemTitle + "(" + submissionInfo.problemCode + ")"
                                }
                            ]}
                            showHeader={false}
                            columns={[
                                {dataIndex: "key"},
                                {dataIndex: "value"}
                            ]}
                        />
                    </Card>
                    {judgeAuth(props.roles, ["admin", "superadmin"]) && (
                        <Card
                            size={"small"}
                            title={<span style={{fontWeight: "bold"}}>{props.t("operator")}</span>}
                            style={{marginTop: 20}}
                        >
                            <Space direction={"horizontal"}>
                                <ReJudge
                                    API={props.RejudgeAPI ?? cApi.rejudge}
                                    data={[submissionInfo.submissionId]}
                                    afterSuccess={props.refresh}
                                />
                                <Invalidate
                                    API={props.InvalidateAPI ?? cApi.invalidateSubmission}
                                    data={{submissionId: submissionInfo.submissionId}}
                                    afterSuccess={props.refresh}
                                />
                                {/*此处需要传入：
                            1. 获取测试单信息的异步函数
                            2. 当前的测试点信息

                            实现：
                            1. 下载第一个错误测试点的数据
                            2. 打包下载全部测试点（弹窗确认）
                            3. 选择测试点进行下载（弹窗，可以多选，可以单点下载）
                            */}
                                <DownloadTestCase
                                />

                            </Space>
                        </Card>
                    )}
                </Col>
            </Row>
            {props.submissionInfo.judgeResult !== 99 && TestCaseStateList.length !== 0 && (
                <Card
                    size="small"
                    title={<span style={{fontWeight: "bold"}}>{props.t("Statistics")}</span>}
                    className={"card"}
                >
                    <Row>
                        {props.scoreMod !== "disable" && props.sumScore !== undefined && (
                            <Col className={"Progress-set"} span={6}>
                                {props.scoreMod === "show" && (
                                    <>
                                        <Progress
                                            success={{percent: info.AC / info.SumAll * 100}}
                                            type="dashboard"
                                            format={() => `${info.AC} / ${info.SumAll}`}
                                        />
                                        <span>{props.t("TotalScore")}</span>
                                    </>
                                )}
                                {props.scoreMod === "partial" && (
                                    <>
                                        <div style={{marginTop: "50px", marginBottom: "40px"}}>
                                            {info.AC === info.SumAll && (
                                                <Title level={5} style={{color: "green"}}>{props.t("allPassed")}</Title>
                                            )}
                                            {info.AC !== info.SumAll && info.AC !== 0 && (
                                                <Title level={5}
                                                       style={{color: "orange"}}>{props.t("partiallyPassed")}</Title>
                                            )}
                                            {info.AC === 0 && (
                                                <Title level={5} style={{color: "red"}}>{props.t("failed")}</Title>
                                            )}
                                        </div>
                                        <span>{props.t("JudgeResult")}</span>
                                    </>
                                )}
                            </Col>
                        )}
                        {props.TimeLimit === undefined && (
                            <Col span={6} style={{margin: "auto"}}>
                                <Statistic title={props.t("MaximumTime")}
                                           value={info.mxTime}
                                           suffix="ms"/>
                            </Col>
                        )}
                        {props.TimeLimit !== undefined && (
                            <Col className={"Progress-set"} span={6}>
                                {
                                    [''].map(() => {
                                        let obj: any = {
                                            percent: 100,
                                            status: "exception"
                                        }
                                        if (info.mxTime <= props.TimeLimit)
                                            obj = {success: {percent: info.mxTime / props.TimeLimit * 100}}
                                        return (
                                            <Progress
                                                {...obj}
                                                type="dashboard"
                                                format={() => `${info.mxTime} / ${props.TimeLimit} ms`}
                                            />
                                        )
                                    })
                                }
                                <span>{props.t("MaximumTime")}</span>
                            </Col>
                        )}
                        {props.MemoryLimit === undefined && (
                            <Col span={6} style={{margin: "auto"}}>
                                <Statistic title={props.t("MaximumMemory")}
                                           value={Math.floor(info.mxMem / 1024)}
                                           suffix="MB"/>
                            </Col>
                        )}
                        {props.MemoryLimit !== undefined && (
                            <Col className={"Progress-set"} span={6}>
                                {
                                    [''].map(() => {
                                        let obj: any = {
                                            percent: 100,
                                            status: "exception"
                                        }
                                        if (info.mxMem <= props.MemoryLimit)
                                            obj = {success: {percent: info.mxMem / props.MemoryLimit * 100}}
                                        return (
                                            <Progress
                                                {...obj}
                                                type="dashboard"
                                                format={() => `${Math.floor(info.mxMem / 1024)} / ${Math.floor(props.MemoryLimit / 1024)} MB`}
                                            />
                                        )
                                    })
                                }
                                <span>{props.t("MaximumMemory")}</span>
                            </Col>
                        )}
                        {props.scoreMod !== "disable" && props.sumScore !== undefined && (
                            <Col className={"Progress-set-Statistic"} span={6}>
                                <Statistic title={props.t("TotalRunningTime")}
                                           value={info.SumTime}
                                           suffix="ms"/>
                                <Statistic className={"Progress-set-Statistic-cell"}
                                           title={props.t("AvgMemory")}
                                           value={Math.floor(info.AvgMem / 1024)}
                                           suffix="MB"/>
                            </Col>
                        )}
                        {(props.scoreMod === "disable" || props.sumScore === undefined) && (
                            <>
                                <Col span={6} style={{margin: "auto"}}>
                                    <Statistic title={props.t("TotalRunningTime")}
                                               value={info.SumTime}
                                               suffix="ms"/>
                                </Col>
                                <Col span={6} style={{margin: "auto"}}>
                                    <Statistic className={"Progress-set-Statistic-cell"}
                                               title={props.t("AvgMemory")}
                                               value={Math.floor(info.AvgMem / 1024)}
                                               suffix="MB"/>
                                </Col>
                            </>
                        )}

                    </Row>
                </Card>
            )}
            {props.testcaseMod === "show" &&
                props.submissionInfo.judgeResult !== 99 &&
                TestCaseStateList.length !== 0 && (
                    <>
                        <Title level={4}> {props.t("JudgeResult")}</Title>
                        <JudgeResult
                            useDownload={false}
                            title={props.t("evaluationDataSet")}
                            data={TestCaseStateList}
                            scoreMod={props.sumScore === undefined ? "disable" : props.scoreMod}
                            sumScore={props.sumScore}
                        />
                        <JudgeResult
                            useDownload={true}
                            title={props.t("publicDataSet")}
                            data={PublicTestCaseStateList}
                            scoreMod={props.sumScore === undefined ? "disable" : props.scoreMod}
                            sumScore={props.sumScore}
                        />
                    </>
                )}
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
)(withTranslation()(Summary))
