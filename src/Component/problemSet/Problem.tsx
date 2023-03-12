import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Badge, Button, Card, Col, message, Row} from "antd";
import ProProgram from "../problem/Program/ProProgram";
import cApi from "../../Utils/API/c-api";
import ProProgramDetail from "../problem/Program/ProProgramDetail";
import RecentSubmissionList from "../submission/SubmissionList/RecentSubmissionList";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import useProblemInfo from "../problem/API/getProblemInfo";
import {UrlPrefix} from "../../Config/constValue";
import {ProblemSetState} from "../../Redux/Action/problemSet";
import {StarFilled, StarOutlined} from "@ant-design/icons";
import ProblemSetPageCtrl from "./ProblemSetPageCtrl";
import useProblemSetInfo from "./API/getProblemSetInfo";
import Objective from "../problem/Objective/Objective";
import Timer from "../common/Timer";
import Subjective from "../problem/Subjective/Subjective";
import Reconfirm from "../common/Reconfirm";
import dealFloat from "../../Utils/dealFloat";
import {TimeRangeState} from "../../Utils/Time";
import {isValueEmpty} from "../../Utils/empty";

const Problem = (props: any) => {
    const psid = props.match.params.problemSetId
    const gid = props.match.params.problemGroupId
    const pid = props.match.params.problemId
    const problemSetInfo = useProblemSetInfo(psid)

    const proName = `problemSet-${psid}-${gid}-${pid}`
    const psType = problemSetInfo?.type
    const groupType = problemSetInfo?.groupInfo[gid].type
    const proType = problemSetInfo?.groupInfo[gid].problemInfo[pid].type
    const score = problemSetInfo?.groupInfo[gid].problemInfo[pid].point

    const [flag, setFlag] = useState(problemSetInfo?.groupInfo[gid].problemInfo[pid].collect)
    const [upd, setUpd] = useState(0)

    useEffect(() => {
        if (problemSetInfo && flag !== problemSetInfo?.groupInfo[gid].problemInfo[pid].collect)
            setFlag(problemSetInfo?.groupInfo[gid].problemInfo[pid].collect)
    }, [psid, pid, gid, problemSetInfo])

    const getTypeText = () => {
        if (proType === 0) return "单选题"
        if (proType === 1) return "多选题"
        if (proType === 2) return "不定项"
    }

    const GetProblemInfoAPI = () => {
        return cApi.getProblemSetProblem({
            router: {psid: psid, gid: gid, pid: pid},
        })
    }
    const SubmissionListAPI = (data: any) => {
        if(!isValueEmpty(props.username)){
            return cApi.getProblemSetSubmissionList({
                ...data,
                router: {psid: psid, gid: gid, pid: pid},
                username: props.username,
                problemSetId: psid
            })
        }else{
            return Promise.reject("用户未登录")
        }

    }

    const submitAPI = (data: any) => {
        return cApi.submitProblemSetProblem({
            data: data,
            router: {psid: psid, gid: gid, pid: pid},
        }).then((res: any) => {
            let hasAnswer = true
            if (groupType !== 2)
                hasAnswer = res
            problemSetInfo.groupInfo[gid].problemInfo[pid].hasAnswer = hasAnswer
            setUpd(upd + 1)
            return Promise.resolve(res)
        })
    }

    const getAs = () => {
        return cApi.getProblemSetProblemAS({
            router: {psid: psid, gid: gid, pid: pid},
        })
    }
    const QuerySubmissionAPI = (submissionId: string) => {
        return cApi.getProblemSetSubmissionInfo({psid: psid, gid: gid, pid: pid, submissionId: submissionId})
    }

    const problemInfo = useProblemInfo(GetProblemInfoAPI, proName)
    const hasTimer = problemSetInfo !== undefined &&
        psType === 1 && problemSetInfo.config.useSameSE === 1 &&
        parseInt(problemSetInfo.tm_end) > Date.now()

    return (
        <div style={{textAlign: "center", margin: "0 auto"}}>
            <div style={{
                textAlign: "left", maxWidth: "1500px", margin: "0 auto", userSelect: "none"
            }}>
                <Row gutter={20} style={{marginTop: "24px"}}>
                    <Col span={17}>
                        <Card title={
                            <>
                                {groupType === 0 && (
                                    <>
                                        【{getTypeText()}】
                                    </>
                                )}
                                <>{parseInt(pid) + 1}.</>
                                {score !== undefined && (
                                    <>（{dealFloat(score)}{props.t(score === 1 ? "point" : "points")}）</>
                                )}
                            </>
                        }
                              extra={
                                  <Button
                                      type="default"
                                      shape="round"
                                      icon={flag ? <StarFilled/> : <StarOutlined/>}
                                      danger={flag}
                                      onClick={() => {
                                          cApi.updateProblemSetProblemCollect({
                                              router: {psid: psid, gid: gid, pid: pid},
                                          }).then((res) => {
                                              problemSetInfo.groupInfo[gid].problemInfo[pid].collect = 1 - flag
                                              setFlag(1 - flag)
                                          })
                                      }}
                                  >
                                      {props.t("Mark")}
                                  </Button>
                              }>
                            {(() => {
                                switch (groupType) {
                                    case 2:
                                        return (
                                            <ProProgram
                                                showMdExport={false}
                                                name={proName}
                                                nameWithD={proName}
                                                GetProblemInfoAPI={GetProblemInfoAPI}
                                                enableLeftSubmitCount={true}
                                                SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                                                    return submitAPI({
                                                        judgeTemplateId: judgeTemplate,
                                                        code: code,
                                                        zipFileId: zipId,
                                                        problemSetId: psid
                                                    })
                                                }}
                                                SubmissionListAPI={SubmissionListAPI}
                                                QuerySubmissionAPI={QuerySubmissionAPI}
                                                scoreMod={"show"}
                                                testcaseMod={"show"}
                                                showInfo={false}
                                            />
                                        )
                                    case 1:
                                        const timeState_running = TimeRangeState(problemSetInfo.tm_start, problemSetInfo.tm_end)
                                        return (
                                            <Subjective
                                                problemInfo={problemInfo}
                                                onAnswerM={submitAPI}
                                                getAS={getAs}
                                                key_o={`sbjective-${psid}-${gid}-${pid}`}
                                                finish={timeState_running === "end"}
                                            />
                                        )
                                    case 0:
                                        return (
                                            <Objective
                                                key_o={`objective-${psid}-${gid}-${pid}`}
                                                onMark={(SID: string) => {
                                                    return cApi.markObjectiveProblem({
                                                        data: SID,
                                                        router: {psid: psid, gid: gid, pid: pid},
                                                    }).then((res: any) => {
                                                        problemSetInfo.groupInfo[gid].problemInfo[pid].hasAnswer = res.hasAnswer
                                                        setUpd(upd + 1)
                                                        return Promise.resolve(res)
                                                    })
                                                }}
                                                onAnswerM={submitAPI}
                                                getAS={getAs}
                                                problemInfo={problemInfo}
                                            />
                                        )
                                }
                            })()}
                        </Card>
                        <ProblemSetPageCtrl/>
                    </Col>
                    <Col span={7}>
                        <div>
                            {hasTimer && (
                                <>
                                    <Reconfirm
                                        btnProps={{block: true, danger: true, type: "primary"}}
                                        btnText={"交卷"}
                                        confirm={props.username}
                                        API={() => {
                                            cApi.finishProblemSet(
                                                {router: {psid: psid, gid: 0, pid: 0}}
                                            ).then(() => {
                                                message.success("交卷成功")
                                                props.history.replace(UrlPrefix + "/problemSetPublic/" + psid)
                                            })
                                        }}
                                        todo={"交卷"}
                                    />
                                    <div style={{marginTop: 24}}>
                                        <Timer
                                            deadline={parseInt(problemSetInfo?.tm_end)}
                                            inline={true}
                                            onFinish={() => {
                                                props.history.replace(UrlPrefix + "/problemSetPublic/" + psid)
                                            }}
                                        />
                                    </div>
                                </>

                            )}
                        </div>
                        <div
                            style={hasTimer ? {marginTop: 25} : {}}>
                            {problemSetInfo?.groupInfo.map((group: any, g_index: number) => {
                                return (
                                    <div>
                                        <Card size={"small"} title={group.name} bordered={false}>
                                            <Row gutter={10}>
                                                {group.problemInfo.map((problem: any, index: number) => {
                                                    return (
                                                        <Col span={3}>
                                                            <Button
                                                                ghost={true}
                                                                size={"middle"}
                                                                type={(g_index.toString() === gid && index.toString() === pid) ? "primary" : "text"}
                                                                shape={"round"}
                                                                onClick={() => {
                                                                    props.history.push(UrlPrefix + "/problemSet/" + psid + "/problem/" + group.index + "/" + index)
                                                                }}
                                                            >
                                                                <Badge dot={problem.collect === 1} offset={[10, 0]}>
                                                                    <span style={{
                                                                        fontWeight: "bold",
                                                                        color: (problem.hasAnswer ? "#3ad506" : undefined)
                                                                    }}>
                                                                        {index + 1}
                                                                    </span>
                                                                </Badge>
                                                            </Button>
                                                        </Col>
                                                    )
                                                })}
                                            </Row>
                                        </Card>
                                    </div>
                                )
                            })}
                        </div>
                        <div>
                            {groupType === 2 && (
                                <>
                                    <div style={{marginTop: 25}}>
                                        <ProProgramDetail
                                            problemInfo={problemInfo}
                                        />
                                    </div>
                                    <div style={{marginTop: 25}}>
                                        <RecentSubmissionList
                                            name={"Pro-SubmissionList-Recent-" + proName}
                                            API={SubmissionListAPI}
                                            QuerySubmissionAPI={QuerySubmissionAPI}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    )
}


const mapStateToProps = (state: any) => {
    const State: UserState = state.UserReducer
    const PSState: ProblemSetState = state.ProblemSetReducer
    return {
        username: State.userInfo?.username,
        problemSetInfo: PSState.problemSetInfo

    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Problem)))
