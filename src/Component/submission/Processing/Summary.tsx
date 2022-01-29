import {withTranslation} from "react-i18next";
import Title from "antd/es/typography/Title";
import {Button, Card, Col, List, Progress, Row, Space, Statistic, Table} from "antd";
import JudgeResult from "../JudgeResult";
import {StateList, SubmissionMap, TestCaseStates} from "../../../Type/ISubmission";
import {unix2Time} from "../../../Utils/Time";
import TestCase from "../TestCase";
import cApi from "../../../Utils/API/c-api";
import ReJudge from "../ReJudge";
import Invalidate from "../Invalidate";
import DownloadTestCase from "../DownloadTestCase";

const Summary = (props: any) => {
    const {TestCaseStateList, submissionInfo} = props
    const getCaseInfo = () => {
        let scoreAC = 0, scoreSum = 0, scoreAll = 0, mxTime: number = 0, mxMem: number = 0
        let SumTime = 0, SumMem = 0
        const Tcl = TestCaseStateList
        for (let i = 0; i < Tcl.length; i++) {
            const add: number = Tcl[i].caseScore === undefined ? 0 : Tcl[i].caseScore
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
            mxTime: mxTime, mxMem: mxMem, SumTime: SumTime, AvgMem: SumMem / Tcl.length
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
                                    value: (<TestCase
                                        type={"text"}
                                        caseType={StateList.indexOf(SubmissionMap[submissionInfo.judgeResult])}
                                    />)
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
                            {

                            }
                            <DownloadTestCase

                            />

                        </Space>
                    </Card>
                </Col>
            </Row>
            {props.submissionInfo.judgeResult !== 99 && (
                <Card
                    size="small"
                    title={<span style={{fontWeight: "bold"}}>{props.t("Statistics")}</span>}
                    className={"card"}
                >
                    <Row>
                        <Col className={"Progress-set"} span={6}>
                            {props.showScore === true && (
                                <>
                                    <Progress
                                        success={{percent: info.AC / info.SumAll * 100}}
                                        type="dashboard"
                                        format={() => `${info.AC} / ${info.SumAll}`}
                                    />
                                    <span>{props.t("TotalScore")}</span>
                                </>
                            )}
                            {props.showScore === false && (
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
                        <Col className={"Progress-set-Statistic"} span={6}>
                            <Statistic title={props.t("TotalRunningTime")}
                                       value={info.SumTime}
                                       suffix="ms"/>
                            <Statistic className={"Progress-set-Statistic-cell"}
                                       title={props.t("AvgMemory")}
                                       value={Math.floor(info.AvgMem / 1024)}
                                       suffix="MB"/>
                        </Col>
                    </Row>
                </Card>
            )}
            {props.showScore === true && props.submissionInfo.judgeResult !== 99 && (
                <>
                    <Title level={4}> {props.t("JudgeResult")}</Title>
                    <JudgeResult data={TestCaseStateList} sumScore={props.sumScore}/>
                </>
            )}
        </>
    )
}

export default withTranslation()(Summary)