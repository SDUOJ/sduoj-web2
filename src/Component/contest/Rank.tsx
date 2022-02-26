import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Table} from "antd";
import {ContestState} from "../../Redux/Action/contest";
import {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import cApi from "Utils/API/c-api"
import "Assert/css/ContestRank.css"
import {TimeRangeState} from "../../Utils/Time";

const Rank = (props: any) => {
    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]
    const [rankInfo, setRankInfo] = useState()
    const [data, setData] = useState()
    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined


    useEffect(() => {
        console.log(timeState)
        cApi.getRank({contestId: contestId}).then((res: any) => {
            console.log(timeState, res)
            if (timeState === "end")
                setData(res.map((value: any, index: number) => {
                    return {
                        ...value,
                        rank: index + 1
                    }
                }))
        })
    }, [rankInfo, setRankInfo, setData, contestId, timeState])

    const problemColumns = []
    let tableWidth = 330
    const problemWidth = 90

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
                        <div style={{color: "grey"}}>
                            {x.acceptNum} / {x.submitNum}
                        </div>
                    </div>
                ),
                width: problemWidth,
                render: (text: any, row: any) => {
                    const SData = row.submissions.find((value: any) => {
                        return value[0] === x.problemCode
                    })
                    if (SData === undefined) return <></>
                    let color = "orange"
                    if (SData[3] === 1) color = "green"
                    if (SData[2] === 0) color = "res"
                    return (
                        <div>
                            {contestInfo.features.mode === "ioi" && (
                                <span style={{
                                    fontWeight: (SData[3] === 1 ? "bold" : undefined),
                                    color: color
                                }}>
                                    {SData[2]}
                                </span>
                            )}
                            {contestInfo.features.mode === "acm" && (
                                ""
                            )}
                        </div>
                    )
                }
            })
            tableWidth += problemWidth
        }
    }

    return (
        <>
            <Table
                className={"RankTable"}
                style={{width: tableWidth}}
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
                        width: 170,
                        render: (text, row) => {
                            return (
                                <div style={{paddingLeft: 10, paddingRight: 10}}>
                                    <span style={{float: "left", marginTop: 10}}>
                                        like
                                    </span>
                                    <span style={{float: "right", textAlign: "right"}}>
                                        <div style={{fontWeight: "bold"}}>{row.username}</div>
                                        <div style={{color: "grey"}}>{row.nickname}</div>
                                    </span>
                                </div>
                            )
                        }
                    },
                    {
                        title: "分数",
                        width: 80,
                        render: (text, row) => {
                            let sumScore = 0
                            row.submissions.map((value: any) => {
                                sumScore += value[2]
                            })
                            return (
                                <>
                                    {contestInfo.features.mode === "ioi" && (
                                        <span>{sumScore}</span>
                                    )}
                                </>
                            )
                        }
                    },
                    ...problemColumns
                ]}
            >

            </Table>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        ContestInfo: State.contestInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Rank)))