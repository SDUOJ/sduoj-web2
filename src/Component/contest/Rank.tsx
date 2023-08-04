import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Col, Modal, Row, Space, Table, Typography} from "antd";
import {ContestState} from "../../Redux/Action/contest";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import cApi from "Utils/API/c-api"
import "Assert/css/ContestRank.css"
import {getDiffSecond, TimeDiff, TimeRangeState} from "../../Utils/Time";
import {ReactComponent as Champion} from "Assert/img/champion.svg"
import Icon, {FileTextOutlined, TeamOutlined} from "@ant-design/icons";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import {isValueEmpty} from "../../Utils/empty";
import {HeartOutlined, HeartFilled} from '@ant-design/icons';


const Rank = (props: any) => {
    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]
    const [rankInfo, setRankInfo] = useState<any>()
    const [data, setData] = useState<any>()
    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined
    const [SummaryInfo, setSummaryInfo] = useState<any>({})
    const [lastSliderTime, setLastSliderTime] = useState<number>(Date.now())

    const [ModalVis, setModalVis] = useState<boolean>(false);
    const [sbl_user, setSbl_user] = useState<string>("");
    const [sbl_pro, setSbl_pro] = useState<string>("");

    const [storedValue, setStoredValue] = useState<string[]>([]);

    useEffect(() => {
        let value: any = window.localStorage.getItem(`contest-like-${contestId}`);
        if (!isValueEmpty(value)) value = JSON.parse(value)
        else value = []
        setStoredValue(value);
    }, []);

    const storeValue = (value: string[]) => {
        if (value.length !== 0) {
            window.localStorage.setItem(`contest-like-${contestId}`, JSON.stringify(value));
        }
        setStoredValue(value);
    };

    useEffect(() => {
        // console.log("00--------------000000000000", contestInfo)
        if (rankInfo === undefined) {
            cApi.getRank({contestId: contestId}).then((res: any) => {
                // 设置可以滑动
                if (res.length > 0 && res[0].submission !== null)
                    props.setAllowSliderMove(true)
                res.map((value: any, index: number) => {
                    if (value.submissions !== null)
                        value.submissions.sort((a: any, b: any) => {
                            return parseInt(a[1]) - parseInt(b[1])
                        })
                })
                setRankInfo(res)
            })
        }
    }, [rankInfo, setRankInfo, contestId, timeState])

    useEffect(() => {
        if (rankInfo !== undefined) {
            if (props.openSliderMove && Math.abs(Date.now() - lastSliderTime) <= 500) return
            if (props.openSliderMove) setLastSliderTime(Date.now())

            // console.log(props.sliderTime)


            const problemInfo = contestInfo.problems
            const summaryInfo: any = {}
            summaryInfo.SumNumber = rankInfo.length

            for (let i = 0; i < problemInfo.length; i++) {
                summaryInfo[`submit_${i}`] = problemInfo[i].submitNum
                summaryInfo[`ac_${i}`] = problemInfo[i].acceptNum
                summaryInfo[`user_submit_${i}`] = 0
                summaryInfo[`user_ac_${i}`] = 0
                summaryInfo[`first_ac_${i}`] = parseInt(contestInfo.gmtEnd) + 1
            }

            // 排序前 进行数据预处理
            const beforeSort = rankInfo.map((value: any, index: number) => {
                let sumScore = 0, ACNumber = 0, penalty = 0
                let cell: any = {}
                const official = value.official

                const convertValue = (value: any, proId: number) => {
                    let color = "", score = 0, minTim: any = undefined, className = ""
                    let tries = 0
                    if (value.length !== 0) {
                        // 已经有结果的情况
                        score = value[1]
                        sumScore += value[1] * problemInfo[proId].problemWeight

                        if (contestInfo.features.mode === "acm") color = "red"
                        else color = "orange"

                        if (value[2] === 1) color = "green"
                        if (value[1] === 0) color = "red"

                        // 统计数据
                        summaryInfo[`user_submit_${proId}`] += 1
                        tries = value[3]

                        if (value[2] === 1) {
                            summaryInfo[`user_ac_${proId}`] += 1
                            if (official === true && parseInt(value[0]) !== 0) {
                                summaryInfo[`first_ac_${proId}`] = Math.min(
                                    summaryInfo[`first_ac_${proId}`],
                                    parseInt(value[0])
                                )
                            }
                            className = "accepted"
                            penalty += 20 * value[3]
                            if (parseInt(value[0]) !== 0) minTim = parseInt(value[0])
                            penalty += getDiffSecond(contestInfo.gmtStart, minTim) / 60
                            ACNumber += 1

                        } else if (value[4] !== 0) {
                            className = "pending"
                            tries -= value[4]
                        } else {
                            className = "rejected"
                        }

                        cell[`${proId + 1}`] = {
                            color: color,
                            score: score,
                            minTime: minTim,
                            tries: tries,
                            pending: value[4],
                            className: className
                        }
                    }
                }

                if (value.submissions === null) {
                    value.problemResults.map((val: any, index: number) => convertValue(val, index))
                } else {
                    const sliderTime = Math.max(props.sliderTime, parseInt(contestInfo.gmtStart))

                    let proSet: any = {}

                    for (let i = 0; i < value.submissions.length; i++) {
                        const sbm = value.submissions[i]
                        if (!props.afterContestSubmission && parseInt(sbm[1]) > parseInt(contestInfo.gmtEnd)) break
                        // 控制提交时间筛选
                        if (props.openSliderMove && parseInt(sbm[1]) > sliderTime) break
                        const proId = sbm[0]

                        if (proSet[proId] === undefined)
                            proSet[proId] = {
                                time: 0,
                                score: -1,
                                result: 0,
                                submission: 0,
                                submissionBeforeAC: 0,
                                pending: 0
                            }
                        // 取最大的分数，分数相同，取最时间小的
                        const obj = proSet[proId]
                        if (obj.score < sbm[2] ||
                            (obj.score === sbm[2] &&
                                (obj.time > parseInt(sbm[1]) ||
                                    (obj.result !== 1 && sbm[3] === 1)
                                )
                            )) {
                            obj.time = parseInt(sbm[1])
                            obj.score = sbm[2]
                            obj.result = sbm[3]
                        }
                        // 统计当前没有结果的提交数量
                        if (sbm[3] < 1) obj.pending += 1
                        // 统计 AC 之前的提交数量
                        if (obj.result !== 1)
                            obj.submissionBeforeAC += 1
                        obj.submission += 1
                    }

                    for (const x in proSet) {
                        convertValue([
                            proSet[x].time.toString(),
                            proSet[x].score,
                            proSet[x].result,
                            proSet[x].submissionBeforeAC + (proSet[x].result === 1 ? 1 : 0),
                            proSet[x].pending
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
            props.setExportData(afterSort)

        }
    }, [rankInfo, props.afterContestSubmission, props.sliderTime])

    const problemColumns: any = [{
        title: "排名",
        dataIndex: "rank",
        width: 80,
        render: (text: any) => {
            return <span className={"center"}> {text} </span>
        }
    }, {
        title: "参赛人",
        width: 150,
        render: (text: any, row: any) => {
            let like = storedValue.includes(row.username);
            return (
                <div style={{paddingLeft: 10, paddingRight: 10}}>
                    <span style={{float: "left", marginTop: 10}}>
                        {like && (
                            <HeartFilled style={{color: 'red'}} onClick={() => {
                                storeValue(storedValue.filter(x => x !== row.username))
                            }}/>
                        )}
                        {!like && (
                            <HeartOutlined onClick={() => {
                                storeValue([...storedValue, row.username])
                            }}/>
                        )}
                    </span>
                    <span style={{float: "right", textAlign: "right"}}>
                        <div style={{fontWeight: "bold"}}>{row.username}</div>
                        <div style={{color: "grey", fontSize: 12}}>{row.nickname}</div>
                    </span>
                </div>
            )
        }
    }, {
        title: "分数",
        width: 100,
        render: (text: any, row: any) => {
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
    }]
    let tableWidth = 330
    const problemWidth = 70

    if (contestInfo !== undefined) {
        for (const x of contestInfo.problems) {
            problemColumns.push({
                title: (
                    <div className={"ProHeader"}>
                        <div>
                            <span style={{fontWeight: "bold"}}>
                                {String.fromCharCode('A'.charCodeAt(0) + parseInt(x.problemCode) - 1)}
                            </span>
                            {!isValueEmpty(x.problemColor) && (
                                <span style={{paddingLeft: 4}}>
                                    <span className={"circle"} style={{backgroundColor: x.problemColor}}/>
                                </span>
                            )}
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
                        <div
                            style={{cursor: 'pointer'}}
                            onClick={() => {
                                setSbl_user(row.username)
                                setSbl_pro(x.problemCode)
                                setModalVis(true)
                            }}>
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
                                        <div style={{fontSize: 16}}>
                                            &nbsp;&nbsp;
                                        </div>
                                    )}
                                    <div>
                                        <span>
                                            {SData.tries !== 0 && (
                                                <span>{SData.tries}</span>
                                            )}
                                            {SData.pending !== 0 && (
                                                <span>
                                                    {SData.tries !== 0 && (
                                                        <span>+</span>
                                                    )}
                                                    {SData.pending}
                                                </span>
                                            )}
                                            &nbsp;{SData.tries + SData.pending <= 1 ? "try" : "tries"}
                                        </span>


                                    </div>
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

    // 创建一个新的 dataWithLike 数组
    let dataWithLike: any = [];
    // 保存 like 元素的索引
    let lastLikeIndex = -1;
    if (data !== undefined) {
        for (let i = 0; i < data.length; i++) {
            let dataItem = data[i];
            if (storedValue.includes(dataItem.username)) {
                dataWithLike.push(dataItem);
                lastLikeIndex = dataWithLike.length - 1;  // 更新 lastLikeIndex
            }
        }
        dataWithLike = [...dataWithLike, ...data]
    }


    return (
        <>
            <Modal
                width={1250}
                visible={ModalVis}
                footer={false}
                destroyOnClose={true}
                onCancel={() => {
                    setModalVis(false)
                }}
            >
                <SubmissionList
                    btnText={"记录-" + sbl_user + "-" + sbl_pro}
                    name={"Contest-Rank-SubmissionList-" + sbl_user + "-" + sbl_pro}
                    API={async (data: any) => {
                        return cApi.getContestSubmissionList({
                            ...data,
                            problemCode: sbl_pro,
                            username: sbl_user,
                            contestId: contestId
                        })
                    }}
                    QuerySubmissionAPI={async (submissionId: string) => {
                        return cApi.getContestSubmissionInfo({contestId: contestId, submissionId: submissionId})
                    }}
                />
            </Modal>
            <Table
                className={"RankTable"}
                style={{width: tableWidth, minWidth: tableWidth}}
                pagination={false}
                bordered={true}
                dataSource={dataWithLike}
                rowClassName={(row, index) => {
                    let className = 'rowBase';
                    if (index === lastLikeIndex) {
                        className += ' rowLikeLast';
                    }
                    if (storedValue.includes(row.username)) {
                        className += ' rowLike';
                    }
                    return className;
                }}
                columns={problemColumns}
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
                                                            <Typography.Text ellipsis={{
                                                                tooltip: TimeDiff(contestInfo.gmtStart, SummaryInfo[`first_ac_${i}`], "d", "h", "m", "s"),
                                                            }} style={{width: 50}}>
                                                                {TimeDiff(contestInfo.gmtStart, SummaryInfo[`first_ac_${i}`], "d", "h", "m", "s")}
                                                            </Typography.Text>
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
        afterContestSubmission: State.afterContestSubmission,
        allowSliderMove: State.allowSliderMove,
        sliderTime: State.sliderTime,
        openSliderMove: State.openSliderMove
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setMinWidth: (data: number) => dispatch({
        type: "setMinWidth", data: data
    }),
    setAllowSliderMove: (data: boolean) => dispatch({
        type: "setAllowSliderMove", data: data
    }),
    setExportData: (data: any) => dispatch({
        type: "setExportData", data: data
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Rank)))
