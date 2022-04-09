import {withTranslation} from "react-i18next";
import Title from "antd/es/typography/Title";
import {Card, Col, Progress, Row, Space, Statistic, Table} from "antd";
import JudgeResult from "./JudgeResult";
import {StateList, SubmissionMap, TestCaseStates} from "../../../Type/ISubmission";
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
    const {TestCaseStateList, submissionInfo} = props
    const getCaseInfo = () => {
        let scoreAC = 0, scoreSum = 0, scoreAll = 0, mxTime: number = 0, mxMem: number = 0
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
            scoreAll += add
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
                    <Card size={"small"} title={<span style={{fontWeight: "bold"}}>评测信息</span>}>
                        <Table
                            size={"small"}
                            pagination={false}
                            dataSource={[
                                {
                                    key: "结论",
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
                                {key: "编号", value: submissionInfo.submissionId},
                                {key: "提交时间", value: unix2Time(submissionInfo.gmtCreate)},
                                {key: "评测时间", value: unix2Time(submissionInfo.gmtModified)},
                                {key: "评测模板", value: submissionInfo.judgeTemplateTitle},
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
                    <Card size={"small"} title={<span style={{fontWeight: "bold"}}>关联信息</span>}>
                        <Table
                            size={"small"}
                            pagination={false}
                            dataSource={[
                                {key: "提交用户", value: submissionInfo.username + " (ID: " + submissionInfo.userId + ")"},
                                {
                                    key: "题目信息",
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
                            title={<span style={{fontWeight: "bold"}}>操作</span>}
                            style={{marginTop: 20}}
                        >
                            <Space direction={"horizontal"}>
                                <ReJudge
                                    API={cApi.rejudge}
                                    data={[submissionInfo.submissionId]}
                                    afterSuccess={props.refresh}
                                />
                                <Invalidate
                                    API={cApi.invalidateSubmission}
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
                                                <Title level={5} style={{color: "green"}}>全部通过</Title>
                                            )}
                                            {info.AC !== info.SumAll && info.AC !== 0 && (
                                                <Title level={5} style={{color: "orange"}}>部分通过</Title>
                                            )}
                                            {info.AC === 0 && (
                                                <Title level={5} style={{color: "red"}}>未通过</Title>
                                            )}
                                        </div>
                                        <span>评测结果</span>
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
                        {(props.scoreMod === "disable" ||  props.sumScore === undefined) && (
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
                        data={TestCaseStateList}
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
    return {
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(Summary))