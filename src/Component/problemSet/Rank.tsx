import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Badge, Table} from "antd";
import {ContestState, setMinWidth} from "../../Redux/Action/contest";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import "Assert/css/ContestRank.css"
import cApi from "Utils/API/c-api"
import {CheckOutlined, QuestionOutlined} from "@ant-design/icons";
import useProblemSetInfo from "./API/getProblemSetInfo";

const Rank = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    const problemSetInfo = useProblemSetInfo(problemSetId)

    const [rankInfo, setRankInfo] = useState<any>()

    useEffect(() => {
        if (rankInfo === undefined) {
            cApi.getProblemSummary({psid: problemSetId}).then((res: any) => {
                setRankInfo(res)
            })
        }
    }, [rankInfo, setRankInfo])

    const problemColumns = []
    let tableWidth = 330
    const problemWidth = 70

    if (problemSetInfo !== undefined) {
        for (const x of problemSetInfo.groupInfo) {
            const getTp = () => {
                if (x.type === 0) return "客观题"
                if (x.type === 1) return "主观题"
                if (x.type === 2) return "编程题"
            }
            const col: any = {
                title: <>
                    <div>{`题组${x.index + 1} - ${x.name}`}</div>
                    <div>{`${getTp()}`}</div>
                </>,
                children: []
            }
            for (const y of x.problemInfo) {
                col.children.push({
                    title: (
                        <div className={"ProHeader"}>
                            <div>
                                <span style={{fontWeight: "bold"}}>
                                    题目 {y.index + 1}
                                </span>
                            </div>
                        </div>
                    ),
                    dataIndex: `${x.index + 1}-${y.index + 1}`,
                    width: problemWidth,
                    render: (text: any, row: any) => {
                        if (text.h) {
                            // 是否已经阅卷
                            if (text.j) {
                                return (
                                    <Badge count={<CheckOutlined style={{color: '#52c41a'}}/>} offset={[15, -3]}>
                                        <span style={{fontWeight: "bold"}}>{text.s}</span>
                                    </Badge>
                                )
                            } else {
                                return (
                                    <Badge count={<QuestionOutlined style={{color: '#faad14'}}/>} offset={[15, -3]}>
                                        <span style={{fontWeight: "bold"}}>{text.s}</span>
                                    </Badge>
                                )
                            }
                        }

                    }
                })
                tableWidth += problemWidth
            }
            problemColumns.push(col)
        }
        if (props.minWidth !== tableWidth)
            props.setMinWidth(tableWidth)
    }

    return (
        <div style={{marginTop: 24}}>
            <Table
                className={"RankTable"}
                style={{width: tableWidth, minWidth: tableWidth}}
                pagination={false}
                bordered={true}
                dataSource={rankInfo}
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
                                    <span style={{float: "right", textAlign: "right"}}>
                                        <div style={{fontWeight: "bold"}}>{row.username}</div>
                                        <div style={{color: "grey", fontSize: 12}}>{row.nickname}</div>
                                    </span>
                                </div>
                            )
                        }
                    },
                    {
                        title: "总分",
                        width: 100,
                        render: (text, row) => {
                            return (
                                <>
                                    <span>{row.sum_score}</span>
                                </>
                            )
                        }
                    },
                    ...problemColumns
                ]}
            >
            </Table>
        </div>
    )
}

const mapStateToProps = (state: any) => {
    const State: ContestState = state.ContestReducer
    return {
        minWidth: State.minWidth,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setMinWidth: (data: number) => dispatch({
        type: "setMinWidth", data: data
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Rank)))
