import React, {Component, Dispatch} from 'react';
import {connect} from "react-redux";
import {ExamAction, getExamInfoTodo} from "../../Redux/Action/exam";
import {Col, Row, Skeleton} from "antd";
import Problem from "../problem/Problem";
import ExamPageCtrl from "./ExamPageCtrl";
import ExamAnswerSheet from "./ExamAnswerSheet";
import Timer from "./Timer";
import {ExamState} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {withRouter} from "react-router-dom";

class ExamRun extends Component<any, any> {


    componentDidMount() {
        if (this.props.examInfo == undefined) {
            this.props.getExamInfo(this.props.match.params.eid)
        }
    }

    render() {
        return (
            <>
                <Skeleton active loading={this.props.examInfo == undefined}>
                    <div className={"ExamRun"}>
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
                                            onFinish={()=>{this.props.history.push("/v2/exam/finish")}}
                                        />
                                        <ExamAnswerSheet/>
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
    return {
        examInfo: EState.examInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getExamInfo: (eid: examID) => dispatch(getExamInfoTodo(eid))

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamRun))