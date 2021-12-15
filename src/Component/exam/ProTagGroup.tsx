import React, {Component, Dispatch} from "react";

import Meta from "antd/lib/card/Meta";
import ProTag from "./ProTag";
import {Card, Col, Row} from "antd";
import {ExamState, SProInfo} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {getExamProblemListTodo} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


class ProTagGroup extends Component<any, any> {
    render() {
        return (
            <>

                <Card
                    bordered={false}
                    title={this.props.groupInfo.title}
                    className={"ProTagGroup"}
                >
                    <Row gutter={[0, 16]}>
                        {
                            this.props.groupInfo.proList.map((value: SProInfo) => {
                                return (
                                    <Col span={3}>
                                        <ProTag GroupIndex={this.props.groupInfo.index} ProIndex={value.index + 1}/>
                                    </Col>
                                )
                            })
                        }
                    </Row>
                </Card>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {

    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ProTagGroup)
    ))