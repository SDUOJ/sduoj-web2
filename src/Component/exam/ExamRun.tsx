import React, {Component, Dispatch} from 'react';
import {connect} from "react-redux";
import {ExamAction, getExamInfoTodo, setProgramSubmissionList} from "../../Redux/Action/exam";
import {Button, Col, Modal, Row, Skeleton} from "antd";
import Problem from "../problem/Problem";
import ExamPageCtrl from "./ExamPageCtrl";
import ExamAnswerSheet from "./ExamAnswerSheet";
import Timer from "./Timer";
import {ExamState} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {withRouter} from "react-router-dom";
import RecentSubmission from "../submission/RecentSubmission";
import Processing from "../submission/Processing";
import {SubmissionState} from "../../Type/ISubmission";
import {setSubmissionModalVis} from "../../Redux/Action/submission";
import eApi from "Utils/API/e-api"
import {Submission} from "../../Type/IProblem";

class ExamRun extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ProcessingVis: false
        }
    }

    componentDidMount() {
        if (this.props.examInfo == undefined) {
            this.props.getExamInfo(this.props.match.params.eid)
            this.setState({
                ProcessingVis: this.props.submissionModalVis
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.submissionModalVis != this.props.submissionModalVis) {
            this.setState({
                ProcessingVis: this.props.submissionModalVis
            })
        }
    }

    getSubmissionList = (problemGroup: number, problemIndex: number) => {
        return eApi.getSubmissionList({
            examId: this.props.match.params.eid,
            problemGroup: problemGroup,
            problemIndex: problemIndex
        })
    }

    AfterGetSubmissionList = (data: Submission[]) => {
        this.props.setProgramSubmissionList(data)
    }


    getSubmission = (submissionId: string) => {
        return eApi.getSubmission(this.props.match.params.eid, submissionId)
    }

    render() {
        return (
            <>
                <Skeleton active loading={this.props.examInfo == undefined}>
                    <div className={"ExamRun"}>
                        <Modal
                            title={"提交详情"}
                            visible={this.state.ProcessingVis}
                            onCancel={() => this.props.setSubmissionModalVis(false)}
                            width={1200}
                            footer={[
                                <Button key="back" onClick={() => {
                                    this.props.setSubmissionModalVis(false)
                                }}>
                                    关闭
                                </Button>
                            ]}
                        >
                            <Processing QuerySubmission={this.getSubmission}/>
                        </Modal>
                        <Row>
                            <Col span={22} offset={1}>
                                <Row>
                                    <Col span={16}>
                                        <Problem flag={true}/>
                                        <ExamPageCtrl/>
                                    </Col>
                                    <Col span={7} className={"ExamRun-ExamAnswerSheet"}>
                                        <Timer
                                            deadline={this.props.examInfo?.endTime}
                                            inline={true}
                                            onFinish={() => {
                                                this.props.history.push("/v2/exam/finish")
                                            }}
                                        />
                                        <ExamAnswerSheet/>
                                        <RecentSubmission
                                            getSubmissionList={this.getSubmissionList}
                                            AfterGetSubmissionList={this.AfterGetSubmissionList}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </div>
                </Skeleton>
            </>

        )
    }
}


const mapStateToProps = (state: any) => {
    const EState: ExamState = state.ExamReducer
    const SubState: SubmissionState = state.SubmissionReducer
    return {
        submissionModalVis: SubState.SubmissionModalVis,
        examInfo: EState.examInfo,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getExamInfo: (eid: examID) => dispatch(getExamInfoTodo(eid)),
    setSubmissionModalVis: (data: boolean) => dispatch({
        type: "setSubmissionModalVis", data: data
    }),
    setProgramSubmissionList: (data: Submission[]) => dispatch({
        type: "setProgramSubmissionList",
        data: data
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamRun))