import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Badge, message, Modal, Popover, Table, Tag} from "antd";
import {ContestState} from "../../Redux/Action/contest";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import "Assert/css/ContestRank.css"
import cApi from "Utils/API/c-api"
import {CheckOutlined, QuestionOutlined} from "@ant-design/icons";
import dealFloat from "../../Utils/dealFloat";
import {unix2Time} from "../../Utils/Time";
import ExportExcel from "../common/ExportExcel";
import exportRank from "./exportRank";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import SubjectivePreview from "./SubjectivePreview";
import Objective from "../problem/Objective/Objective";

const Rank = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    // const problemSetInfo = useProblemSetInfo(problemSetId)

    const [rankInfo, setRankInfo] = useState<any>()
    const [lastUpdate, setLastUpdate] = useState<any>()
    const [problemSetInfo, setProblemSetInfo] = useState<any>()

    const [ModalVis, setModalVis] = useState<boolean>(false);
    const [ModalInfo, setModalInfo] = useState<any>({});

    useEffect(() => {
        if (rankInfo === undefined) {
            const hied = message.loading({
                content: "榜单信息内容较多，请耐心等待",
                duration: 0,
            })
            cApi.getProblemSummary({psid: problemSetId, code: 0}).then((res: any) => {
                setRankInfo(res.data)
                setLastUpdate(res.lastUpdate)
                setProblemSetInfo(res.info)
            }).finally(() => {
                hied()
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
                            const cop = text.j ? <CheckOutlined style={{color: '#52c41a'}}/> :
                                <QuestionOutlined style={{color: '#faad14'}}/>
                            return (
                                <div onClick={() => {
                                    setModalVis(true)
                                    let tp = problemSetInfo.groupInfo[x.index].type;
                                    if (tp === 0 || tp === 1) {
                                        const hied = message.loading({
                                            content: "加载中",
                                            duration: 0,
                                        })
                                        cApi.getProblemSetProPreview({
                                            psid: problemSetId,
                                            gid: x.index,
                                            pid: y.index,
                                            username: row.username
                                        }).then((res: any) => {
                                            if (tp === 0) {
                                                setModalInfo({
                                                    type: 0,
                                                    problemInfo: res.problemInfo,
                                                    answerSheet: {
                                                        answer_m: res.answerSheet.answer,
                                                        answer: res.problemInfo.answer,
                                                        mark: res.answerSheet.mark
                                                    },
                                                    key_o: `${x.index + 1}-${y.index + 1}`
                                                })
                                            }
                                            if (tp === 1) {
                                                setModalInfo({
                                                    type: 1,
                                                    description: res.problemInfo.description,
                                                    answer: res.answerSheet.answer
                                                })
                                            }
                                        }).finally(() => {
                                            hied()
                                        })

                                    } else if (tp === 2) {
                                        setModalInfo({
                                            type: 2,
                                            username: row.username,
                                            router: {psid: problemSetId, gid: x.index, pid: y.index},
                                            proName: `题组${x.index + 1} - ${x.name}`
                                        })
                                    }
                                }}>
                                    <Badge count={cop} offset={[15, -3]}>
                                        <span style={{fontWeight: "bold"}}>{dealFloat(text.s)}</span>
                                    </Badge>
                                </div>
                            )
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

    const stateColum: any = []

    if (problemSetInfo?.type === 1) {
        stateColum.push({
            title: "状态",
            width: 150,
            render: (text: any, row: any) => {
                return (
                    <div style={{paddingLeft: 10, paddingRight: 10}}>
                        <span style={{float: "left"}}>
                            {row.finish === 1 && (
                                <Popover content={<>{unix2Time(row.finish_time)}</>} title="交卷时间">
                                    <Tag color={"red"}>交卷</Tag>
                                </Popover>
                            )}
                        </span>
                        <span style={{float: "right", textAlign: "right"}}>
                            {row.ips?.length <= 1 && (
                                <Tag color={"green"}>Ip正常</Tag>
                            )}
                            {row.ips?.length > 1 && (
                                <Popover
                                    content={
                                        <>{row.ips?.map((ip: string) => <div>{ip}</div>)}</>
                                    }
                                    title="使用Ip">
                                    <Tag color={"orange"}>Ip异常</Tag>
                                </Popover>
                            )}
                        </span>
                    </div>
                )
            }
        })
        tableWidth += 150
    }

    return (
        <div style={{marginTop: 24}}>
            <Modal
                width={1250}
                visible={ModalVis}
                footer={false}
                destroyOnClose={true}
                onCancel={() => {
                    setModalVis(false)
                }}
            >
                {ModalInfo.type === 0 && (
                    <Objective
                        problemInfo={ModalInfo?.problemInfo}
                        answerSheet={ModalInfo?.answerSheet}
                        key_o={ModalInfo?.key_o}
                    />
                )}
                {ModalInfo.type === 1 && (
                    <SubjectivePreview
                        description={ModalInfo?.description}
                        answer={ModalInfo?.answer}
                    />
                )}
                {ModalInfo.type === 2 && (
                    <SubmissionList
                        btnText={"记录-" + ModalInfo.username + "-" + ModalInfo.proName}
                        name={"Contest-Rank-SubmissionList-" + ModalInfo.username + "-" + ModalInfo.proName}
                        API={async (data: any) => {
                            return cApi.getProblemSetSubmissionList({
                                ...data,
                                router: ModalInfo.router,
                                username: ModalInfo.username,
                                problemSetId: ModalInfo.router.psid
                            })
                        }}
                        QuerySubmissionAPI={async (submissionId: string) => {
                            return cApi.getProblemSetSubmissionInfo({...ModalInfo.router, submissionId: submissionId})
                        }}
                    />
                )}

            </Modal>
            <div style={{fontWeight: "lighter", marginBottom: 16, marginLeft: 4}}>
                榜单更新有大约1分钟的延迟，上次更新时间：{lastUpdate ? unix2Time(lastUpdate) : undefined}
                <div style={{float: "right"}}>
                    <ExportExcel
                        ButtonProps={{}}
                        ButtonText={"导出成绩"}
                        ButtonType={"default"}
                        getJson={() => exportRank(problemSetId)}
                        fileName={problemSetInfo?.name + "_" + Date.now() + "_结果导出"}
                    />
                </div>
            </div>
            <Table
                className={"RankTable"}
                style={{width: tableWidth, minWidth: tableWidth}}
                pagination={false}
                bordered={true}
                dataSource={rankInfo}
                rowClassName={() => {
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
                    ...stateColum,
                    {
                        title: "总分",
                        width: 100,
                        render: (text, row) => {
                            return (
                                <>
                                    <span>{dealFloat(row.sum_score)}</span>
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
