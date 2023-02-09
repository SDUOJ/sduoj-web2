import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Card, Col, Row, Slider, Space, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import TestCase from "../submission/TestCase";
import {StateList, SubmissionMap} from "../../Type/ISubmission";
import {UrlPrefix} from "../../Config/constValue";
import {ProblemSetState} from "../../Redux/Action/problemSet";
import "Assert/css/problemSet.css"
import {unix2Time} from "../../Utils/Time";
import DTime from "../common/DTime";
import Countdown from "antd/lib/statistic/Countdown";

const Overview = (props: any) => {

    const problemSetId = props.match.params.problemSetId
    const problemSetInfo = props.problemSetInfo[problemSetId] ?? {
        groupInfo: [
            {
                index: 0, type: "program", title: "编程题", data: [
                    {index: 0, title: "题目A", state: "Accept", score: "100"},
                    {index: 1, title: "题目B", state: "Accept", score: "100"},
                    {index: 2, title: "题目C", state: "Accept", score: "100"},
                ], gmtStart: 1663678496284, gmtEnd: 1663778496284, delay: [
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 3, 1],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 5, 0.7],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 7, 0.4],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 9, 0.1],
                    [1663778496284, 0],
                ]
            },
            {
                index: 1, type: "objective", title: "选择题", data: [
                    {index: 0, title: "题目A", state: "已提交", score: ""},
                    {index: 1, title: "题目B", state: "已提交", score: ""},
                    {index: 2, title: "题目C", state: "已提交", score: ""},
                ], gmtStart: 1663678496284, gmtEnd: 1663778496284, delay: [
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 3, 1],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 5, 0.7],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 7, 0.4],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 9, 0.1],
                    [1663778496284, 0],
                ]
            },
            {
                index: 2, type: "subjective", title: "主观题", data: [
                    {index: 0, title: "数据结构 实验一 实验报告", state: "未提交", score: ""},
                ], gmtStart: 1663678496284, gmtEnd: 1663778496284, delay: [
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 3, 1],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 5, 0.7],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 7, 0.4],
                    [1663678496284 + (1663778496284 - 1663678496284) / 10 * 9, 0.1],
                    [1663778496284, 0],
                ]
            },
        ]
    }

    const [nowSliderTime, setNowSliderTime] = useState<number>(Date.now())
    const update = () => {
        setNowSliderTime(Date.now())
    }
    useEffect(() => {
        let intervalId = setInterval(() => update(), 1000)
        return () => clearInterval(intervalId)
    })

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1500", margin: "0 auto"}}>
                    {(problemSetInfo !== undefined && (
                        problemSetInfo.groupInfo.map((value: any) => {
                            let timeState = "running"
                            return (
                                <Row gutter={24}>
                                    <Col span={16}>
                                        <Table
                                            className={"problemSet-overview-table"}
                                            size={"small"}
                                            title={() => {
                                                return (
                                                    <>
                                                        题组{value.index + 1} {value.title} {value.type}
                                                    </>
                                                )
                                            }}
                                            dataSource={value.data}
                                            pagination={false}
                                            columns={[
                                                {
                                                    key: "ID",
                                                    title: "ID",
                                                    dataIndex: "index",
                                                    width: "10%",
                                                    render: (text) => {
                                                        return String.fromCharCode('A'.charCodeAt(0) + parseInt(text))
                                                    }
                                                },
                                                {
                                                    key: "title",
                                                    title: props.t("title"),
                                                    dataIndex: "title",
                                                    width: "50%",
                                                    render: (text, row) => {
                                                        return (
                                                            <>
                                                                <Button type={"text"} size={"small"} onClick={() => {
                                                                    props.history.push(UrlPrefix + `/problemSet/${problemSetId}/problem/${value.index}/${row.index}`)
                                                                }}>{text}</Button>
                                                            </>
                                                        )
                                                    }
                                                },
                                                {
                                                    key: "State",
                                                    title: props.t("Status"),
                                                    dataIndex: "state",
                                                    width: "20%",
                                                    render: (text) => {
                                                        if (SubmissionMap[text] === undefined) return <>{text}</>
                                                        else return (
                                                            <TestCase type={"text"}
                                                                      caseType={StateList.indexOf(SubmissionMap[text])}/>
                                                        )
                                                    }
                                                },
                                                {
                                                    key: "Score",
                                                    title: props.t("Score"),
                                                    width: "50%",
                                                    dataIndex: "score"
                                                }
                                            ]}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Card style={{marginTop: "24px"}}>
                                            <div className={"center"}>
                                                <div style={{float: "left"}}>
                                                    <div style={{fontWeight: "bold"}}>开始时间：</div>
                                                    {unix2Time(value.gmtStart)}
                                                </div>
                                                <span>
                                                    {timeState === "wait" && (
                                                        <span style={{color: "blue"}}>
                                                                <Space>
                                                                    距离开始还有：
                                                                    <Countdown
                                                                        className={"contestHeaderTimer"}
                                                                        value={parseInt(value.gmtStart)}
                                                                        format="H 时 m 分 s 秒"
                                                                    />
                                                                </Space>
                                                            </span>
                                                    )}
                                                    {timeState === "running" && (
                                                        <span style={{color: "red"}}>进行中</span>
                                                    )}
                                                    {timeState === "end" && (
                                                        <span style={{color: "green"}}>已结束</span>
                                                    )}
                                                </span>
                                                <div style={{float: "right"}}>
                                                    <div style={{fontWeight: "bold"}}>结束时间：</div>
                                                    {unix2Time(value.gmtEnd)}
                                                </div>
                                            </div>
                                            {timeState !== "wait" && (
                                                <Slider
                                                    style={{marginTop: 50}}
                                                    tipFormatter={null}
                                                    min={parseInt(value.gmtStart)}
                                                    max={parseInt(value.gmtEnd)}
                                                    value={
                                                        Math.max(Math.min(nowSliderTime, parseInt(value.gmtEnd)), parseInt(value.gmtStart))
                                                    }
                                                    marks={(() => {
                                                        let l: any = {}
                                                        for (let x of value.delay) {
                                                            l[x[0]] = (x[1] * 100).toString() + "%"
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
                                                                <span style={{fontWeight: "bold"}}>当前折扣：</span>
                                                                {(()=>{
                                                                    return "100%"
                                                                })()}
                                                            </span>
                                                        )}
                                                    </Col>
                                                    <Col span={8}>

                                                    </Col>
                                                    <Col span={8}>
                                                        {timeState === "running" && (
                                                            <span style={{float: "right"}}>
                                    <span style={{fontWeight: "bold"}}>剩余时间：</span>
                                    <DTime type={"after"} time={problemSetInfo.gmtEnd}/>
                                </span>
                                                        )}
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Card>
                                    </Col>
                                </Row>
                            )
                        })
                    ))}
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ProblemSetState = state.ProblemSetReducer
    return {
        problemSetInfo: State.problemSetInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Overview)))
