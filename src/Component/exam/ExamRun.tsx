import React, {useEffect} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {Col, Row} from "antd";
import ExamProblem from "../problem/Exam/ExamProblem";
import ExamPageCtrl from "./ExamPageCtrl";
import ExamAnswerSheet from "./ExamAnswerSheet";
import Timer from "./Timer";
import {SExamProListInfo, SProList} from "../../Type/IExam";
import {withRouter} from "react-router-dom";
import eApi from "Utils/API/e-api"
import useExamInfo from "./API/getExamInfo";
import deepClone from "../../Utils/deepClone";
import RecentSubmissionList from "../submission/SubmissionList/RecentSubmissionList";
import {UrlPrefix} from "../../Config/constValue";
import {getExamGroupListFunc} from "./API/getExamGroupListFunc";

const ExamRun = (props: any) => {
    const eid = props.match.params.eid
    const gid = props.match.params.gid
    const pid = props.match.params.pid

    const examInfo = useExamInfo(eid)

    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[eid]
    })
    const dispatch = useDispatch()

    // 获取题组信息
    useEffect(() => {
        if (problemList === undefined) {
            eApi.getExamGroupList(eid).then((res: any)=>{
                getExamGroupListFunc(res, eid, dispatch)
            })
        }
    }, [problemList])

    // console.log("problemList", problemList)

    return (
        <>
            <div style={{margin: 35}}>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <div style={{textAlign: "left", maxWidth: "1600px", minWidth: "1300px", margin: "0 auto"}}>
                        <Row>
                            <Col span={16}>
                                <ExamProblem/>
                                <ExamPageCtrl/>
                            </Col>
                            <Col span={7} className={"ExamRun-ExamAnswerSheet"}>
                                <Timer
                                    deadline={examInfo?.endTime}
                                    inline={true}
                                    onFinish={() => {
                                        props.history.push(UrlPrefix + "/exam/finish")
                                    }}
                                />
                                <ExamAnswerSheet problemList={problemList}/>
                                {problemList && problemList[`${eid}_${gid}`].type === "Program" && (
                                    <div style={{marginTop: 30}}>
                                        <RecentSubmissionList
                                            name={`Pro-SubmissionList-Recent-EXAM_${eid}_${gid}_${pid}`}
                                            API={async (data: any) => {
                                                return eApi.getSubmissionList({
                                                    ...data,
                                                    examId: parseInt(eid),
                                                    problemGroup: parseInt(gid),
                                                    problemIndex: parseInt(pid),
                                                })
                                            }}
                                            QuerySubmissionAPI={async (submissionId: string) => {
                                                return eApi.getSubmission(eid, submissionId)
                                            }}
                                        />
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>
            </div>
        </>
    )
}


export default withRouter(ExamRun)