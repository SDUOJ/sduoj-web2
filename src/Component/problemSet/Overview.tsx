import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Card, Col, Modal, Row, Slider, Space, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import {UrlPrefix} from "../../Config/constValue";
import {ProblemSetState} from "../../Redux/Action/problemSet";
import "Assert/css/problemSet.css"
import {TimeRangeState, unix2Time} from "../../Utils/Time";
import DTime from "../common/DTime";
import Countdown from "antd/lib/statistic/Countdown";
import {UserState} from "../../Type/Iuser";
import useProblemSetInfo from "./API/getProblemSetInfo";
import {isValueEmpty} from "../../Utils/empty";
import dealFloat from "../../Utils/dealFloat";
import {StateList, SubmissionMap} from "../../Type/ISubmission";
import TestCase from "../submission/TestCase";

const Overview = (props: any) => {

    const problemSetId = props.match.params.problemSetId
    const problemSetInfo = useProblemSetInfo(problemSetId)

    const [detailInfo, setDetailInfo] = useState<any>()
    const [vis, setVis] = useState<boolean>(false)

    // console.log(problemSetInfo)

    return (
        <>
            <Modal
                open={vis}
                footer={false}
                onOk={() => setVis(false)}
                onCancel={() => setVis(false)}
            >
                <Table
                    size={"small"}
                    columns={[{dataIndex: "key"}, {dataIndex: "value"}]}
                    showHeader={false}
                    pagination={false}
                    dataSource={(() => {
                        const getTime = (t: any) => {
                            return isValueEmpty(t) ? props.t("NotSubmitted") : unix2Time(t)
                        }
                        if (detailInfo?.proType !== 2)
                            return [
                                {key: props.t("Score"), value: detailInfo?.score},
                                {key: props.t("PointValue"), value: detailInfo?.point},
                                {key: props.t("Weight"), value: detailInfo?.weight},
                                {
                                    key: props.t("submissionTime"),
                                    value: getTime(detailInfo?.submit_time)
                                },
                            ]
                        else {
                            const AL = [
                                {key: props.t("TimedSubmission"), value: detailInfo?.e_id},
                                {key: props.t("TimedWeight"), value: detailInfo?.e_weight},
                                {key: props.t("TimedSubmitTime"), value: getTime(detailInfo?.e_submit_time)},
                            ]
                            const BL = [
                                {key: props.t("PracticeSubmission"), value: detailInfo?.p_id},
                                {key: props.t("PracticeWeight"), value: detailInfo?.p_weight},
                                {key: props.t("PracticeSubmitTime"), value: getTime(detailInfo?.p_submit_time)},
                            ]
                            let ML = [
                                {key: props.t("Score"), value: detailInfo?.score},
                                {key: props.t("PointValue"), value: detailInfo?.point},
                            ]
                            if (detailInfo?.type === "sameTimeAndPractice") {
                                ML = ML.concat(AL)
                                ML = ML.concat(BL)
                            } else if (detailInfo?.type === "sameTime") {
                                ML = ML.concat(AL)
                            } else {
                                ML = ML.concat(BL)
                            }
                            return ML
                        }
                    })()}
                />
            </Modal>
            {(problemSetInfo !== undefined && (
                <>
                    {(() => {
                        if (problemSetInfo.config.useSameSE === 1) {
                            const timeState_running = TimeRangeState(problemSetInfo.tm_start, problemSetInfo.tm_end)
                            if (timeState_running === "end" && problemSetInfo.config.usePractice === 1) {
                                let practiceTimeSetting = problemSetInfo.config.practiceTimeSetting
                                let start = practiceTimeSetting[0].tm_start
                                let end = practiceTimeSetting[practiceTimeSetting.length - 1].tm_end
                                return (
                                    <div style={{marginTop: 24}}>
                                        <TimeCard
                                            start={parseInt(start)}
                                            end={parseInt(end)}
                                            timeSetting={practiceTimeSetting}
                                            bordered={false}
                                        />
                                    </div>
                                )
                            } else {
                                return (
                                    <div style={{marginTop: 24}}>
                                        <TimeCard
                                            start={parseInt(problemSetInfo.tm_start)}
                                            end={parseInt(problemSetInfo.tm_end)}
                                            timeSetting={[{
                                                tm_start: problemSetInfo.tm_start,
                                                tm_end: problemSetInfo.tm_end,
                                                weight: 1
                                            }]}
                                            bordered={false}
                                        />
                                    </div>
                                )
                            }
                        }
                    })()}
                    {problemSetInfo.groupInfo.map((value: any) => {
                        let start, end
                        if (value.timeSetting !== null) {
                            start = value.timeSetting[0].tm_start
                            end = value.timeSetting[value.timeSetting.length - 1].tm_end
                        }
                        const programCol: any = []
                        if (value.type === 2) {
                            programCol.push({
                                key: "Result",
                                title: props.t("JudgeResult"),
                                width: "auto",
                                render: (text: any, row: any) => {
                                    return (
                                        <Space size={24}>
                                            {row.e_status && (
                                                <Space size={0}>
                                                    {props.t("TimedSubmission")}:
                                                    <TestCase
                                                        type={"text"}
                                                        caseType={StateList.indexOf(SubmissionMap[row.e_status])}
                                                    />
                                                </Space>
                                            )}
                                            {row.p_status && (
                                                <Space size={0}>
                                                    {props.t("PracticeSubmission")}:
                                                    <TestCase
                                                    type={"text"}
                                                    caseType={StateList.indexOf(SubmissionMap[row.p_status])}
                                                />
                                                </Space>
                                            )}
                                        </Space>
                                    )
                                }
                            })
                        }
                        return (
                            <Row gutter={24}>
                                <Col span={problemSetInfo.config.useSameSE === 1 ? 24 : 16}>
                                    <Table
                                        className={"problemSet-overview-table"}
                                        size={"small"}
                                        title={() => {
                                            if (problemSetInfo.config.showScoreInRunning === 0) {
                                                return (<>
                                                    {props.t("problemGroup")}{value.index + 1} {value.name}
                                                </>)
                                            } else {
                                                return (<>
                                                    {props.t("problemGroup")}{value.index + 1} {value.name} {`(${dealFloat(value.point)}${props.t(value.point === 1 ? "point" : "points")})`}
                                                </>)
                                            }
                                        }}
                                        dataSource={value.problemInfo}
                                        pagination={false}
                                        columns={[
                                            {
                                                key: "ID",
                                                title: "ID",
                                                dataIndex: "index",
                                                width: "auto",
                                                render: (text, row, index) => {
                                                    return (
                                                        <Button type={"text"} size={"small"} onClick={() => {
                                                            props.history.push(UrlPrefix + `/problemSet/${problemSetId}/problem/${value.index}/${index}`)
                                                        }}>{index + 1} {row.name ? `(${row.name})` : ""}</Button>
                                                    )
                                                }
                                            },
                                            {
                                                key: "State",
                                                title: props.t("Status"),
                                                dataIndex: "hasAnswer",
                                                width: "auto",
                                                render: (text, row) => {
                                                    if (value.type === 1) {
                                                        if (text) {
                                                            if (row.hasJudge === false && row.judgeLock === null) {
                                                                return `${props.t("Submitted")} - ${props.t("NotReviewed")}`
                                                            } else if (row.hasJudge === false && row.judgeLock !== null) {
                                                                return `${props.t("Submitted")} - ${props.t("Reviewing")}`
                                                            } else if (row.hasJudge === true) {
                                                                return `${props.t("Submitted")} - ${props.t("Reviewed")}`
                                                            } else return props.t("Submitted")
                                                        } else return props.t("NotSubmitted")
                                                    } else {
                                                        if (text) return props.t("Submitted")
                                                        else return props.t("NotSubmitted")
                                                    }
                                                }
                                            },
                                            ...programCol,
                                            {
                                                key: "Point",
                                                title: props.t("ScoreAndDetails"),
                                                width: "auto",
                                                dataIndex: "point",
                                                render: (text, row) => {
                                                    if (problemSetInfo.config.showScoreInRunning === 0) {
                                                        return "-"
                                                    } else {
                                                        if (row.score === undefined)
                                                            return (
                                                                <span> {`-/${text.toFixed(2)}`}  </span>
                                                            )
                                                        return (
                                                            <span>
                                                            <Button type={"link"} onClick={() => {
                                                                setDetailInfo({...row, proType: value.type})
                                                                setVis(true)
                                                            }}>
                                                                {`${dealFloat(row.score)}/${dealFloat(text)}`}
                                                            </Button>
                                                        </span>
                                                        )

                                                    }
                                                }
                                            },
                                            // {
                                            //     key: "antiCheatingRate",
                                            //     title: "查重率与查重结果",
                                            //     width: "auto",
                                            //     dataIndex: "antiCheatingRate",
                                            //     render: (text, row) => {
                                            //         if (text === undefined) return "不查重"
                                            //         return <span>{text} / 暂未查重</span>
                                            //     }
                                            // },
                                        ]}
                                    />
                                </Col>
                                {problemSetInfo.config.useSameSE === 0 && (
                                    <Col span={8}>
                                        <TimeCard
                                            start={parseInt(start)}
                                            end={parseInt(end)}
                                            timeSetting={[]}
                                            bordered={true}
                                        />
                                    </Col>
                                )}
                            </Row>
                        )
                    })}
                </>
            ))}

        </>
    )
}

interface TimeCardProps {
    start: number
    end: number
    timeSetting: any
    bordered: boolean
}

const TimeCard = (props: TimeCardProps) => {
    const {t} = require('react-i18next').useTranslation();
    const [nowSliderTime, setNowSliderTime] = useState<number>(Date.now())
    const update = () => {
        setNowSliderTime(Date.now())
    }
    useEffect(() => {
        let intervalId = setInterval(() => update(), 1000)
        return () => clearInterval(intervalId)
    })
    let timeState = TimeRangeState(props.start, props.end)
    return (
        <>
            <Card bordered={props.bordered}>
                <div className={"center"}>
                    <div style={{float: "left"}}>
                        <div style={{fontWeight: "bold"}}>{t("StartTimeLabel")}</div>
                        {unix2Time(props.start)}
                    </div>
                    <span>
                        {timeState === "wait" && (
                            <span style={{color: "blue"}}>
                                <Space>
                                    {t("TimeUntilStart")}
                                    <Countdown
                                        className={"contestHeaderTimer"}
                                        value={props.start}
                                        format={t("TimeFormat")}
                                    />
                                </Space>
                            </span>
                        )}
                        {timeState === "running" && (
                            <span style={{color: "red"}}>{t("running")}</span>
                        )}
                        {timeState === "end" && (
                            <span style={{color: "green"}}>{t("ended")}</span>
                        )}
                                                </span>
                    <div style={{float: "right"}}>
                        <div style={{fontWeight: "bold"}}>{t("EndTimeLabel")}</div>
                        {unix2Time(props.end)}
                    </div>
                </div>
                {timeState !== "wait" && (
                    <Slider
                        style={{marginTop: 50}}
                        tipFormatter={null}
                        min={props.start}
                        max={props.end}
                        value={
                            Math.max(Math.min(nowSliderTime, props.end), props.start)
                        }
                        marks={props.timeSetting.length === 0 ? undefined : (() => {
                            let l: any = {}
                            for (let i = 0; i < props.timeSetting.length; i++) {
                                let x = props.timeSetting[i]
                                l[x.tm_end] = (x.weight * 100).toString() + "%"
                            }
                            return l
                        })()}
                    />
                )}
                <div style={{marginTop: 15}} className={"center"}>
                    <Row>
                        <Col span={8}>
                            {timeState === "running" && (
                                <span style={{float: "left"}}>
                                    <span style={{fontWeight: "bold"}}>{t("CurrentDiscount")}</span>
                                    {(() => {
                                        for (let i = 0; i < props.timeSetting.length; i++) {
                                            let x = props.timeSetting[i]
                                            if (x.tm_start <= Date.now() && Date.now() <= x.tm_end) {
                                                return (x.weight * 100).toString() + "%"
                                            }
                                        }
                                    })()}
                                </span>
                            )}
                        </Col>
                        <Col span={8}>

                        </Col>
                        <Col span={8}>
                            {timeState === "running" && (
                                <span style={{float: "right"}}>
                                    <span style={{fontWeight: "bold"}}>{t("DiscountRemaining")}</span>
                                    {(() => {
                                        for (let i = 0; i < props.timeSetting.length; i++) {
                                            let x = props.timeSetting[i]
                                            if (x.tm_start <= Date.now() && Date.now() <= x.tm_end) {
                                                return (
                                                    <DTime type={"after"} time={x.tm_end}/>
                                                )
                                            }
                                        }
                                    })()}
                                </span>
                            )}
                        </Col>
                    </Row>
                </div>
            </Card>

        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ProblemSetState = state.ProblemSetReducer
    const UState: UserState = state.UserReducer
    return {
        problemSetInfo: State.problemSetInfo,
        roles: UState.userInfo?.roles
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Overview)))
