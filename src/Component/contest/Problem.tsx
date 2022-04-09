import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Card, Col, Row, Table} from "antd";
import ProProgram from "../problem/Program/ProProgram";
import cApi from "../../Utils/API/c-api";
import ProProgramDetail from "../problem/Program/ProProgramDetail";
import RecentSubmissionList from "../submission/SubmissionList/RecentSubmissionList";
import React, {Dispatch} from "react";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import useProblemInfo from "../problem/API/getProblemInfo";
import {isValueEmpty} from "../../Utils/empty";
import {ContestState} from "../../Redux/Action/contest";
import {UrlPrefix} from "../../Config/constValue";

const Problem = (props: any) => {
    const problemCode = props.match.params.problemCode
    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]


    const proName = "Contest-" + contestId + "-" + problemCode

    const GetProblemInfoAPI = () => {
        return cApi.getContestProblem({contestId: contestId, problemCode: problemCode})
    }
    const SubmissionListAPI = (data: any) => {
        return cApi.getContestSubmissionList({
            ...data,
            problemCode: problemCode,
            username: props.username,
            contestId: contestId
        })
    }
    const QuerySubmissionAPI = (submissionId: string) => {
        return cApi.getContestSubmissionInfo({contestId: contestId, submissionId: submissionId})
    }

    const problemInfo = useProblemInfo(GetProblemInfoAPI, proName)

    return (
        <>
            <Row gutter={20}>
                <Col span={17}>
                    <Card size={"small"}>
                        <ProProgram
                            name={proName}
                            nameWithD={proName}
                            GetProblemInfoAPI={GetProblemInfoAPI}
                            SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                                return cApi.submitContestProblem({
                                    judgeTemplateId: judgeTemplate,
                                    code: code,
                                    problemCode: problemCode,
                                    zipFileId: zipId,
                                    contestId: contestId
                                })
                            }}
                            SubmissionListAPI={SubmissionListAPI}
                            QuerySubmissionAPI={QuerySubmissionAPI}
                            scoreMod={"show"}
                            testcaseMod={"show"}
                            showInfo={false}
                        />
                    </Card>
                </Col>
                <Col span={7}>
                    <div>
                        <Row gutter={10}>
                            {contestInfo?.problems.map((value: any) => {
                                return (
                                    <Col span={3}>
                                        <Button
                                            size={"middle"}
                                            type={value.problemCode === problemCode ? "primary" : "text"}
                                            shape={"round"}
                                            onClick={() => {
                                                props.history.push(UrlPrefix + "/contest/" + contestId + "/problem/" + value.problemCode)
                                            }}
                                        >
                                            <span style={{fontWeight: "bold"}}>
                                                {String.fromCharCode('A'.charCodeAt(0) + parseInt(value.problemCode) - 1)}
                                            </span>
                                        </Button>
                                    </Col>
                            )
                            })}
                            </Row>
                            </div>
                                <div style={{marginTop: 25}}>
                                    <ProProgramDetail
                                        problemInfo={problemInfo}
                                    />
                                </div>
                                <div style={{marginTop: 25}}>
                                    <Card title={"题目导航"} className={"smallBodyPadding"}>
                                        <Table
                                            size={"small"}
                                            dataSource={contestInfo?.problems}
                                            pagination={false}
                                            showHeader={false}
                                            columns={[
                                                {
                                                    key: "ID",
                                                    title: "ID",
                                                    dataIndex: "problemCode",
                                                    render: (text) => {
                                                        return String.fromCharCode('A'.charCodeAt(0) + parseInt(text) - 1)
                                                    }
                                                },
                                                {
                                                    key: "title",
                                                    title: props.t("title"),
                                                    dataIndex: "problemTitle",
                                                    render: (text, row) => {
                                                        return (
                                                            <>
                                                                {!isValueEmpty(row.problemColor) && (
                                                                    <span className={"circle"}
                                                                          style={{backgroundColor: row.problemColor}}/>
                                                                )}
                                                                <Button type={"text"} size={"small"} onClick={() => {
                                                                    props.history.push(UrlPrefix + "/contest/" + contestId + "/problem/" + row.problemCode)
                                                                }}>{text}</Button>
                                                            </>
                                                        )
                                                    }
                                                },
                                                {
                                                    key: "AC_Submits",
                                                    title: "通过 / 提交",
                                                    render: (text, row) => {
                                                        return (
                                                            <>
                                                                {row.acceptNum} / {row.submitNum}
                                                            </>
                                                        )
                                                    }
                                                }
                                            ]}
                                        >

                                        </Table>
                                    </Card>
                                </div>
                                <div style={{marginTop: 25}}>
                                    <RecentSubmissionList
                                        name={"Pro-SubmissionList-" + proName}
                                        API={SubmissionListAPI}
                                        QuerySubmissionAPI={QuerySubmissionAPI}
                                    />
                                </div>
                            </Col>
                            </Row>
                            </>
                            )
                            }

                                const mapStateToProps = (state: any) => {
                                const State: UserState = state.UserReducer
                                const CState: ContestState = state.ContestReducer
                                return {
                                username: State.userInfo?.username,
                                ContestInfo: CState.contestInfo

                            }
                            }

                                const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

                                export default connect(
                                mapStateToProps,
                                mapDispatchToProps
                                )(withTranslation()(withRouter(Problem)))