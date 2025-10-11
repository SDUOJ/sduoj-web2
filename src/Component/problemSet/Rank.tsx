import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Badge, Button, Empty, List, message, Modal, Space, Table} from "antd";
import {ContestState} from "../../Redux/Action/contest";
import React, {Dispatch, useEffect, useMemo, useState} from "react";
import {connect} from "react-redux";
import "Assert/css/ContestRank.css"
import cApi from "Utils/API/c-api"
import {CheckOutlined, DownloadOutlined, QuestionOutlined} from "@ant-design/icons";
import dealFloat from "../../Utils/dealFloat";
import {unix2Time} from "../../Utils/Time";
import ExportExcel from "../common/ExportExcel";
import exportRank from "./exportRank";
import SubmissionList from "../submission/SubmissionList/SubmissionList";
import SubjectivePreview from "./SubjectivePreview";
import Objective from "../problem/Objective/Objective";
import useProblemSetInfo from "./API/getProblemSetInfo";

const Rank = (props: any) => {
    const problemSetId = props.match.params.problemSetId
    const [rankInfo, setRankInfo] = useState<any>()
    const [lastUpdate, setLastUpdate] = useState<any>()
    const [summaryProblemSetInfo, setSummaryProblemSetInfo] = useState<any>()
    const detailProblemSetInfo = useProblemSetInfo(problemSetId)

    const [ModalVis, setModalVis] = useState<boolean>(false);
    const [ModalInfo, setModalInfo] = useState<any>({});
    const [subjectiveExportVisible, setSubjectiveExportVisible] = useState<boolean>(false);
    const [exportingKey, setExportingKey] = useState<string | null>(null);

    // antd v5: message.loading 不再返回关闭函数，这里封装一个通用的显示/隐藏方法
    const showLoading = (key: string, content: string) => {
        message.loading({key, content, duration: 0});
        return () => message.destroy(key);
    }

    const fileSubjectiveProblems = useMemo(() => {
        if (!detailProblemSetInfo || !Array.isArray(detailProblemSetInfo.groupInfo)) return []
        const result: Array<{
            gid: number,
            pid: number,
            groupName?: string,
            problemName?: string,
            groupIndex: number,
            problemIndex: number
        }> = []
        detailProblemSetInfo.groupInfo.forEach((group: any, gIndex: number) => {
            if (!group || group.type !== 1 || !Array.isArray(group.problemInfo)) return
            const parsedGroupIndex = Number(group.index)
            const groupIndex = Number.isNaN(parsedGroupIndex) ? gIndex : parsedGroupIndex
            group.problemInfo.forEach((problem: any, pIndex: number) => {
                if (!problem || problem.type !== 0) return
                const parsedProblemIndex = Number(problem.index)
                const problemIndex = Number.isNaN(parsedProblemIndex) ? pIndex : parsedProblemIndex
                result.push({
                    gid: groupIndex,
                    pid: problemIndex,
                    groupName: group.name,
                    problemName: problem.name,
                    groupIndex,
                    problemIndex
                })
            })
        })
        return result
    }, [detailProblemSetInfo])

    const sanitizeFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "_")

    const handleExportSubjective = (item: {
        gid: number,
        pid: number,
        problemName?: string,
        problemIndex: number
    }) => {
        if (!detailProblemSetInfo && !summaryProblemSetInfo) return
        const psidNumber = Number(problemSetId)
        if (Number.isNaN(psidNumber)) {
            message.error(props.t("SubjectiveExportFailed"))
            return
        }
        const gid = Number(item.gid)
        const pid = Number(item.pid)
        const key = `${gid}-${pid}`
        setExportingKey(key)
        const hide = showLoading(`SubjectiveExportLoading-${key}`, props.t("Loading"))
        const problemLabel = item.problemName && item.problemName.trim().length > 0
            ? item.problemName
            : `${props.t("Problem")} ${item.problemIndex + 1}`
        const psRawName = detailProblemSetInfo?.name ?? summaryProblemSetInfo?.name
        const psName = psRawName && `${psRawName}`.trim().length > 0 ? `${psRawName}` : "ProblemSet"
        const rawFileName = `${psName}-${problemLabel}.zip`
        const downloadName = sanitizeFilename(rawFileName)
        cApi.exportProblemSetSubjectiveZip({
            router: {
                psid: psidNumber,
                gid,
                pid
            }
        }, downloadName).then(() => {
            message.success(props.t("SubjectiveExportSuccess"))
        }).catch(() => {
            message.error(props.t("SubjectiveExportFailed"))
        }).finally(() => {
            hide()
            setExportingKey(prev => prev === key ? null : prev)
        })
    }

    useEffect(() => {
        if (rankInfo === undefined) {
            const hide = showLoading("RankLoadingHint", props.t("RankLoadingHint"))
            cApi.getProblemSummary({psid: problemSetId, code: 0}).then((res: any) => {
                setRankInfo(res.data)
                setLastUpdate(res.lastUpdate)
                setSummaryProblemSetInfo(res.info)
            }).finally(() => {
                hide()
            })
        }
    }, [problemSetId, props.t, rankInfo])

    useEffect(() => {
        setRankInfo(undefined)
        setSummaryProblemSetInfo(undefined)
        setLastUpdate(undefined)
    }, [problemSetId])

    const problemColumns = []
    let tableWidth = 330
    const problemWidth = 70

    const lastUpdateDisplay = lastUpdate ? unix2Time(lastUpdate) : props.t("RankUpdateTimePending")
    const exportFileSuffix = props.t("RankExportFilenameSuffix")

    if (summaryProblemSetInfo !== undefined) {
        for (const x of summaryProblemSetInfo.groupInfo) {
            const getTp = () => {
                if (x.type === 0) return props.t("ObjectiveQuestions")
                if (x.type === 1) return props.t("SubjectiveQuestions")
                if (x.type === 2) return props.t("ProgrammingQuestions")
            }
            const col: any = {
                title: <>
                    <div>{props.t("ProblemGroup")}{x.index + 1} - {x.name}</div>
                    <div>{getTp()}</div>
                </>,
                children: []
            }
            for (const y of x.problemInfo) {
                col.children.push({
                    title: (
                        <div className={"ProHeader"}>
                            <div>
                                <span style={{fontWeight: "bold"}}>
                                    {props.t("Problem")} {y.index + 1}
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
                                    let tp = summaryProblemSetInfo.groupInfo[x.index].type;
                                    if (tp === 0 || tp === 1) {
                                        const hide = showLoading("ProblemSetPreviewLoading", props.t("Loading"))
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
                                            hide()
                                        })

                                    } else if (tp === 2) {
                                        setModalInfo({
                                            type: 2,
                                            username: row.username,
                                            router: {psid: problemSetId, gid: x.index, pid: y.index},
                                            router_submission: {psid: problemSetId, gid: -1, pid: -1},
                                            proName: `${props.t("ProblemGroup")}${x.index + 1} - ${x.name}`
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

    return (
        <div style={{marginTop: 24}}>
            <Modal
                width={1250}
                open={ModalVis}
                footer={false}
                // antd v5 使用 destroyOnClose 取代自定义的 destroyOnHidden
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
                        btnText={props.t("RecordPrefix") + ModalInfo.username + "-" + ModalInfo.proName}
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
                            return cApi.getProblemSetSubmissionInfo({
                                ...ModalInfo.router_submission,
                                submissionId: submissionId
                            })
                        }}
                    />
                )}

            </Modal>
            <Modal
                title={props.t("SubjectiveExportTitle")}
                open={subjectiveExportVisible}
                footer={null}
                onCancel={() => setSubjectiveExportVisible(false)}
                destroyOnHidden={true}
            >
                <div style={{marginBottom: 16, color: "rgba(0,0,0,0.65)"}}>
                    {props.t("SubjectiveExportDescription")}
                </div>
                {fileSubjectiveProblems.length === 0 ? (
                    <Empty description={props.t("SubjectiveExportEmpty")}/>
                ) : (
                    <List
                        itemLayout={"horizontal"}
                        dataSource={fileSubjectiveProblems}
                        rowKey={(item) => `${item.gid}-${item.pid}`}
                        renderItem={(item) => {
                            const groupLabel = `${props.t("ProblemGroup")}${item.groupIndex + 1}${item.groupName ? ` - ${item.groupName}` : ""}`
                            const problemLabel = `${props.t("Problem")} ${item.problemIndex + 1}${item.problemName ? ` - ${item.problemName}` : ""}`
                            const key = `${item.gid}-${item.pid}`
                            return (
                                <List.Item
                                    key={key}
                                    actions={[
                                        <Button
                                            key={"download"}
                                            type={"primary"}
                                            icon={<DownloadOutlined/>}
                                            onClick={() => handleExportSubjective(item)}
                                            disabled={!!exportingKey && exportingKey !== key}
                                            loading={exportingKey === key}
                                        >
                                            {props.t("SubjectiveExportDownload")}
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={groupLabel}
                                        description={problemLabel}
                                    />
                                </List.Item>
                            )
                        }}
                    />
                )}
            </Modal>
            <div style={{fontWeight: "lighter", marginBottom: 16, marginLeft: 4}}>
                {props.t("RankUpdateNotice", {time: lastUpdateDisplay})}
                <div style={{float: "right"}}>
                    <Space size={8}>
                        <Button
                            type={"default"}
                            onClick={() => setSubjectiveExportVisible(true)}
                            disabled={!detailProblemSetInfo}
                        >
                            {props.t("SubjectiveExport")}
                        </Button>
                        <ExportExcel
                            ButtonProps={{}}
                            ButtonText={props.t("RankExportScoreButton")}
                            ButtonType={"default"}
                            getJson={() => exportRank(problemSetId)}
                            fileName={(summaryProblemSetInfo?.name ?? detailProblemSetInfo?.name ?? "ProblemSet") + "_" + Date.now() + "_" + exportFileSuffix}
                        />
                    </Space>
                </div>
            </div>
            <Table
                className={"RankTable"}
                style={{width: tableWidth, minWidth: tableWidth}}
                pagination={false}
                bordered={true}
                dataSource={rankInfo ?? []}
                rowKey={(row: any) => row.username}
                rowClassName={() => {
                    return "rowBase"
                }}
                columns={[
                    {
                        title: props.t("RankColumnRanking"),
                        dataIndex: "rank",
                        width: 80,
                        render: (text) => {
                            return <span className={"center"}> {text} </span>
                        }
                    },
                    {
                        title: props.t("RankColumnParticipant"),
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
                        title: props.t("RankColumnTotalScore"),
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
