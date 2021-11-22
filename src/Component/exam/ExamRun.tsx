import React, {Component, Dispatch} from 'react';
import {connect} from "react-redux";
import {ExamState} from "../../Redux/Reducer/exam";
import {ExamAction} from "../../Redux/Action/exam";
import {Col, Row} from "antd";
import Problem from "../problem/Problem";
import ExamPageCtrl from "./ExamPageCtrl";
import ExamAnswerSheet from "./ExamAnswerSheet";
import Timer from "./Timer";

class ExamRun extends Component<any, any> {

    render() {
        return (
            <>
                <div className={"ExamRun"}>
                    <Row>
                        <Col span={18} offset={3}>
                            <Row>
                                <Col span={16}>
                                    <Problem proType={"SingleChoice"} index={2} score={10} flag={true}/>
                                    <ExamPageCtrl TopProblemIndex={"0"} ProNumber={"20"} />
                                </Col>
                                <Col span={7} className={"ExamRun-ExamAnswerSheet"}>
                                    <Timer deadline={Date.now() + 1000 * 60 * 60} inline={true}/>
                                    <ExamAnswerSheet />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </div>
            </>

        )
    }
}


const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExamRun)