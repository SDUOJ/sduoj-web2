import React, {Component, Dispatch, useEffect} from "react";
import {Button, Card, Skeleton} from "antd";
import {StarFilled, StarOutlined} from '@ant-design/icons';
import ExamChoice from "./ExamChoice";
import {connect, useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {examID} from "../../../Type/types";
import eApi from "../../../Utils/API/e-api";
import ProProgram from "../Program/ProProgram";
import useProblemInfo from "../API/getProblemInfo";


const ExamProblem = (props: any) => {

    useEffect(() => {
        document.oncontextmenu = function (e) {/*屏蔽浏览器默认右键事件*/
            e = e || window.event;
            return false;
        };
    })

    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const GetProblemInfoAPI = () => {
        return eApi.getProInfo({
            examId: eid,
            groupIndex: gid,
            problemIndex: pid
        })
    }

    const problemInfo = useProblemInfo(GetProblemInfoAPI, `EXAM_${eid}_${gid}_${pid}`)
    console.log("problemInfo", problemInfo)

    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[eid + "_" + gid]
    })
    console.log("@@@@@", problemList)

    const baseInfo = problemList?.proList[pid] ?? {index: undefined, score: undefined}
    const proType = problemList?.type

    return (

        <Card
            className={"Problem"}
            title={
                <>
                    【{props.t(proType)}】
                    {baseInfo.index !== undefined && (
                        <>{baseInfo.index + 1}.</>
                    )}
                    {baseInfo.score !== undefined && (
                        <>（{baseInfo.score}{props.t(baseInfo.score === 1 ? "point" : "points")}）</>
                    )}
                </>
            }
            extra={
                proType !== "Program" && (
                    <Button type="default"
                            shape="round"
                            icon={props.isFlag ? <StarFilled/> : <StarOutlined/>}
                            danger={props.isFlag}
                            onClick={() => props.flipFlag(eid, gid, pid)}
                    >
                        {props.t("Mark")}
                    </Button>
                )
            }>

            {(() => {
                switch (proType) {
                    case "Program":
                        return (
                            <ProProgram
                                nameWithD={`EXAM_${eid}_${gid}_${pid}`}
                                name={`EXAM_${eid}_${gid}_${pid}`}
                                GetProblemInfoAPI={GetProblemInfoAPI}
                                SubmitAPI={(judgeTemplate: string, code: string, zipId: string) => {
                                    return eApi.CreateSubmit({
                                        judgeTemplateId: judgeTemplate,
                                        code: code,
                                        zipFileId: zipId,
                                        problemIndex: pid,
                                        groupIndex: gid,
                                        examId: eid,
                                        problemCode: pid
                                    })
                                }}
                                SubmissionListAPI={async (data: any) => {
                                    return eApi.getSubmissionList({
                                        ...data,
                                        examId: eid,
                                        problemGroup: gid,
                                        problemIndex: pid
                                    })
                                }}
                                QuerySubmissionAPI={async (submissionId: string) => {
                                    return eApi.getSubmission(eid, submissionId)
                                }}
                                scoreMod={"show"}
                                testcaseMod={"show"}
                                showInfo={true}
                            />
                        )
                    case "SingleChoice":
                    case "MultipleChoice":
                        return (
                            <ExamChoice/>
                        )
                }
            })()}
        </Card>
    )

}


const mapStateToProps = (state: any) => {

}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    flipFlag: (examId: examID) => dispatch({
        type: "flipFlag",
        examId: examId
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ExamProblem)))