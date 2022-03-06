import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Col, Row, Space, Table} from "antd";
import {ContestState, setMinWidth} from "../../Redux/Action/contest";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import cApi from "Utils/API/c-api"
import "Assert/css/ContestRank.css"
import {getDiffSecond, TimeDiff, TimeRangeState} from "../../Utils/Time";
import {ReactComponent as Champion} from "Assert/img/champion.svg"
import Icon, {TeamOutlined, FileTextOutlined} from "@ant-design/icons";

const Rank = (props: any) => {
    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]
    const [rankInfo, setRankInfo] = useState()
    const [data, setData] = useState()
    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined
    const [SummaryInfo, setSummaryInfo] = useState<any>({})


    useEffect(() => {
        // console.log("00--------------000000000000", contestInfo)
        const problemInfo = contestInfo.problems
        cApi.getRank({contestId: contestId}).then((res: any) => {
            // console.log(timeState, res)
            const summaryInfo: any = {}
            summaryInfo.SumNumber = res.length

            for (let i = 0; i < problemInfo.length; i++) {
                summaryInfo[`submit_${i}`] = problemInfo[i].submitNum
                summaryInfo[`ac_${i}`] = problemInfo[i].acceptNum
                summaryInfo[`user_submit_${i}`] = 0
                summaryInfo[`user_ac_${i}`] = 0
                summaryInfo[`first_ac_${i}`] = parseInt(contestInfo.gmtEnd) + 1
            }

            // 排序前 进行数据预处理
            const beforeSort = res.map((value: any, index: number) => {
                let sumScore = 0, ACNumber = 0, penalty = 0
                let cell: any = {}
                const official = value.official

                const convertValue = (value: any, proId: number) => {
                    let color = "", score = undefined, minTim: any = undefined, className = ""
                    if (value.length !== 0 && parseInt(value[0]) !== 0) {
                        score = value[1]
                        sumScore += value[1] * problemInfo[proId].problemWeight

                        color = "orange"
                        if (value[2] === 1) color = "green"
                        if (value[1] === 0) color = "red"

                        // 统计数据
                        summaryInfo[`user_submit_${proId}`] += 1

                        if (value[2] === 1) {
                            summaryInfo[`user_ac_${proId}`] += 1
                            if (official === true) {
                                summaryInfo[`first_ac_${proId}`] = Math.min(
                                    summaryInfo[`first_ac_${proId}`],
                                    parseInt(value[0])
                                )
                            }
                            className = "accepted"
                            penalty += 20 * value[3]
                            minTim = parseInt(value[0])
                            penalty += getDiffSecond(contestInfo.gmtStart, minTim) / 60
                            ACNumber += 1
                        } else className = "rejected"
                    }
                    cell[`${proId + 1}`] = {
                        color: color,
                        score: score,
                        minTime: minTim,
                        tries: value[3] + (value[2] === 1),
                        className: className
                    }
                }

                if (value.submissions === null) {
                    value.problemResults.map((value: any, index: number) => convertValue(value, index))
                } else {
                    let proSet: any = {}
                    value.submissions.sort((a: any, b: any) => {
                        return parseInt(a[1]) - parseInt(b[1])
                    })
                    value.submissions.map((value: any) => {
                        if(!props.afterContestSubmission && parseInt(value[1]) > parseInt(contestInfo.gmtEnd))
                            return
                        if (proSet[value[0]] === undefined)
                            proSet[value[0]] = {
                                time: 0,
                                score: -1,
                                result: 0,
                                submission: 0,
                                submissionBeforeAC: 0
                            }
                        const proId = value[0]
                        // 取最大的分数，分数相同，取最时间小的
                        if (proSet[proId].score < value[2]
                            || (proSet[proId].score == value[2]
                                && (proSet[proId].time > parseInt(value[1]) ||
                                    (proSet[proId].result !== 1 && value[3] === 1)
                                )
                            )
                        ) {
                            proSet[proId].time = parseInt(value[1])
                            proSet[proId].score = value[2]
                            proSet[proId].result = value[3]
                        }
                        if (proSet[proId].result !== 1) proSet[proId].submissionBeforeAC += 1
                        proSet[proId].submission += 1
                    })
                    for (const x in proSet) {
                        convertValue([
                            proSet[x].time.toString(),
                            proSet[x].score,
                            proSet[x].result,
                            proSet[x].submissionBeforeAC,
                            0
                        ], parseInt(x) - 1)
                    }
                }
                return {
                    username: value.username,
                    nickname: value.nickname,
                    official: value.official,
                    rank: index + 1,
                    sumScore: sumScore,
                    Cell: cell,
                    ACNumber: ACNumber,
                    penalty: penalty,
                }
            })

            // 排序
            beforeSort.sort((a: any, b: any) => {
                if (contestInfo.features.mode === "acm") {
                    if (a.ACNumber === b.ACNumber) return a.penalty - b.penalty
                    return b.ACNumber - a.ACNumber
                } else if (contestInfo.features.mode === "ioi") {
                    return b.sumScore - a.sumScore
                }
            })

            const equ = (a: any, b: any) => {
                if (contestInfo.features.mode === "acm") {
                    return a.ACNumber === b.ACNumber && Math.abs(a.penalty - b.penalty) < 1e-6
                } else if (contestInfo.features.mode === "ioi") {
                    return a.sumScore === b.sumScore
                }
            }

            // 排序并重置排名
            let nowRank = 1, sumIndex = 0;
            const afterSort = beforeSort.map((value: any, index: number) => {
                if (value.official === false) return {...value, rank: "*"}
                else {
                    sumIndex += 1;
                    if (index === 0) return {...value, rank: 1}
                    else {
                        if (equ(beforeSort[index - 1], value))
                            return {...value, rank: nowRank}
                        nowRank = sumIndex
                        return {...value, rank: nowRank}
                    }
                }
            })

            setSummaryInfo(summaryInfo)
            setData(afterSort)
        })
    }, [rankInfo, setRankInfo, setData, contestId, timeState, props.afterContestSubmission])

    const problemColumns = []
    let tableWidth = 330
    const problemWidth = 70

    if (contestInfo !== undefined) {
        for (const x of contestInfo.problems) {
            problemColumns.push({
                title: (
                    <div className={"ProHeader"}>
                        <div>
                            <span
                                style={{fontWeight: "bold"}}>{String.fromCharCode('A'.charCodeAt(0) + parseInt(x.problemCode) - 1)}</span>
                            {/* TODO 气球颜色 */}
                        </div>
                        <div style={{color: "grey", fontSize: 12}}>
                            {x.acceptNum} / {x.submitNum}
                        </div>
                    </div>
                ),
                width: problemWidth,
                render: (text: any, row: any) => {
                    const SData = row.Cell[x.problemCode]
                    if (SData === undefined) return <></>
                    return (
                        <div>
                            {contestInfo.features.mode === "ioi" && (
                                <span style={{
                                    fontWeight: "bold",
                                    color: SData.color
                                }}>
                                    {SData.score}
                                </span>
                            )}
                            {contestInfo.features.mode === "acm" && (
                                <div
                                    className={Math.abs(SData.minTime - SummaryInfo[`first_ac_${x.problemCode - 1}`]) < 1e-6 ? "firstAccept" : SData.className}>
                                    {SData.minTime !== undefined && (
                                        <div style={{fontSize: 16}}>
                                            {Math.floor(getDiffSecond(contestInfo.gmtStart, SData.minTime) / 60)}
                                        </div>
                                    )}
                                    {SData.minTime === undefined && (
                                        <>&nbsp;&nbsp;</>
                                    )}
                                    <div>{SData.tries} {SData.tries === 1 ? "try" : "tries"}</div>
                                </div>
                            )}
                        </div>
                    )
                }
            })
            tableWidth += problemWidth
        }
        if (props.minWidth !== tableWidth)
            props.setMinWidth(tableWidth)
    }

    return (
        <>
            <Table
                className={"RankTable"}
                style={{width: tableWidth, minWidth: tableWidth}}
                pagination={false}
                bordered={true}
                dataSource={data}
                rowClassName={(row, index) => {
                    return "rowBase"
                }}
                columns={[
                    {
                        title: "排名",
                        dataIndex: "rank",
                        width: 80,
                        render: (text) => {
                            return <span className={"center"}> {text} </span>
                        }
                    },
                    {
                        title: "参赛人",
                        width: 150,
                        render: (text, row) => {
                            return (
                                <div style={{paddingLeft: 10, paddingRight: 10}}>
                                    <span style={{float: "left", marginTop: 10}}>
                                        {/*TODO::like*/}
                                    </span>
                                    <span style={{float: "right", textAlign: "right"}}>
                                        <div style={{fontWeight: "bold"}}>{row.username}</div>
                                        <div style={{color: "grey", fontSize: 12}}>{row.nickname}</div>
                                    </span>
                                </div>
                            )
                        }
                    },
                    {
                        title: "分数",
                        width: 100,
                        render: (text, row) => {
                            return (
                                <>
                                    {contestInfo.features.mode === "ioi" && (
                                        <span>{row.sumScore}</span>
                                    )}
                                    {contestInfo.features.mode === "acm" && (
                                        <Row>
                                            <Col span={12}><span
                                                style={{fontWeight: "bold"}}>{row.ACNumber}</span></Col>
                                            <Col span={11}><span>{Math.floor(row.penalty)}</span></Col>
                                        </Row>
                                    )}
                                </>
                            )
                        }
                    },
                    ...problemColumns
                ]}
                summary={() => (
                    <Table.Summary>
                        <Table.Summary.Row className={"RankSummary"}>
                            <Table.Summary.Cell index={0} colSpan={2}>
                                <Space size={50}>
                                    总结
                                    <div style={{textAlign: "left", fontSize: 12}}>
                                        <div><FileTextOutlined/> 通过数/提交数</div>
                                        <div><TeamOutlined/> 通过用户/提交用户</div>
                                        <div><Icon component={Champion}/> 最早通过</div>
                                    </div>
                                </Space>
                            </Table.Summary.Cell>
                            {Object.keys(SummaryInfo).length !== 0 && (
                                <>
                                    <Table.Summary.Cell index={1}> <TeamOutlined/> {SummaryInfo.SumNumber}
                                    </Table.Summary.Cell>
                                    {contestInfo.problems.map((x: any) => {
                                        const i = parseInt(x.problemCode) - 1
                                        return (
                                            <Table.Summary.Cell index={2 + i} className={"RankSummary-Pro"}>
                                                <div>
                                                    <FileTextOutlined/> {SummaryInfo[`ac_${i}`]}/{SummaryInfo[`submit_${i}`]}
                                                </div>
                                                <div>
                                                    <TeamOutlined/> {SummaryInfo[`user_ac_${i}`]}/{SummaryInfo[`user_submit_${i}`]}
                                                </div>
                                                <div>
                                                    {parseInt(contestInfo.gmtEnd) + 1 !== SummaryInfo[`first_ac_${i}`] && (
                                                        <div>
                                                            <Icon component={Champion}/>
                                                            <>{TimeDiff(contestInfo.gmtStart, SummaryInfo[`first_ac_${i}`], "d", "h", "m", "s")}</>
                                                        </div>
                                                    )}
                                                </div>
                                            </Table.Summary.Cell>
                                        )
                                    })}
                                </>
                            )}
                        </Table.Summary.Row>
                    </Table.Summary>
                )}
            >

            </Table>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        ContestInfo: State.contestInfo,
        minWidth: State.minWidth,
        afterContestSubmission: State.afterContestSubmission
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setMinWidth: (data: number) => dispatch({
        type: "setMinWidth", data: data
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Rank)))