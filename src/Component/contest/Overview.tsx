import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Table} from "antd";
import React, {Dispatch} from "react";
import {connect} from "react-redux";
import {ContestState} from "../../Redux/Action/contest";
import {isValueEmpty} from "../../Utils/empty";
import TestCase from "../submission/TestCase";
import {StateList, SubmissionMap} from "../../Type/ISubmission";
import {UrlPrefix} from "../../Config/constValue";

const Overview = (props: any) => {

    const contestId = props.match.params.contestId
    const contestInfo = props.ContestInfo[contestId]

    return (
        <>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "1200px", margin: "0 auto"}}>
                    <Table
                        className={"overview-table"}
                        size={"middle"}
                        dataSource={contestInfo?.problems}
                        pagination={false}
                        columns={[
                            {
                                key: "ID",
                                title: "ID",
                                dataIndex: "problemCode",
                                render: (text: string) => {
                                    return String.fromCharCode('A'.charCodeAt(0) + parseInt(text) - 1)
                                }
                            },
                            {
                                key: "title",
                                title: props.t("title"),
                                dataIndex: "problemTitle",
                                render: (text: string, row: any) => {
                                    return (
                                        <>
                                            {!isValueEmpty(row.problemColor) && (
                                                <span className={"circle"} style={{backgroundColor: row.problemColor}}/>
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
                                title: props.t("AcceptedSlashSubmitted"),
                                render: (_text: any, row: any) => {
                                    return (
                                        <>
                                            {row.acceptNum} / {row.submitNum}
                                        </>
                                    )
                                }
                            },
                            {
                                key: "State",
                                title: props.t("Status"),
                                dataIndex: "judgeResult",
                                render: (text) => {
                                    if (text === null) return <></>
                                    else return (
                                        <TestCase type={"text"}
                                                  caseType={StateList.indexOf(SubmissionMap[text])}/>
                                    )
                                }
                            },
                            {
                                key: "Score",
                                title: props.t("Score"),
                                dataIndex: "judgeScore"
                            }
                        ]}

                    >

                    </Table>
                </div>
            </div>
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
)(withTranslation()(withRouter(Overview)))