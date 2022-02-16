import React, {Component, Dispatch, Suspense} from 'react';
import {connect} from "react-redux";
import {Col, Row, Skeleton} from "antd";
import ExamProblem from "../problem/Exam/ExamProblem";
import ExamPageCtrl from "./ExamPageCtrl";
import ExamAnswerSheet from "./ExamAnswerSheet";
import Timer from "./Timer";
import {ExamState, SExamInfo} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {withRouter} from "react-router-dom";
import eApi from "Utils/API/e-api"
import {Submission} from "../../Type/IProblem";
import SubmissionModal from "../submission/Processing/ModalProcessing";
import useExamInfo from "./API/getExamInfo";

const ExamRun = (props: any) => {

    const examInfo = useExamInfo(props.match.params.eid)

    const getSubmissionList = (problemGroup: number, problemIndex: number) => {
        return eApi.getSubmissionList({
            examId: props.match.params.eid,
            problemGroup: problemGroup,
            problemIndex: problemIndex
        })
    }

    return (
        <>
            <div style={{margin: 35}}>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <div style={{textAlign: "left", maxWidth: "1600px", minWidth: "1300px", margin: "0 auto"}}>
                        <Row>
                            <Col span={16}>
                                <ExamProblem flag={true}/>
                                <ExamPageCtrl/>
                            </Col>
                            <Col span={7} className={"ExamRun-ExamAnswerSheet"}>
                                <Timer
                                    deadline={props.examInfo?.endTime}
                                    inline={true}
                                    onFinish={() => {
                                        props.history.push("/v2/exam/finish")
                                    }}
                                />
                                <ExamAnswerSheet/>

                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </>
    )
}


export default withRouter(ExamRun)