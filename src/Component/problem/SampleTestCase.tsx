import React, {Component, Dispatch} from 'react';
import {ExamState, SProInfo} from "../../Redux/Reducer/exam";
import {ProgramContent, TestCase} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {Col, Row, Space} from "antd";
import Paragraph from "antd/lib/typography/Paragraph";
import CopyableCode from "../submission/CopyableCode";
import Title from "antd/lib/typography/Title";


class SampleTestCase extends Component<any, any> {

    render() {
        return (
            <>
                <Title level={3}> {this.props.t("SampleTestCase")} </Title>
                {
                    this.props.testCase.map((value: TestCase, index: number) => {
                        console.log(value)
                        return (
                            <>
                                <Title level={4}> {this.props.t("Sample") + " " + (index + 1)} </Title>
                                <Row align={"top"} style={{fontSize: "16px"}}>
                                    <Col span={11}>
                                        {this.props.t("Input")}:
                                        <CopyableCode code={value.inputData}/>
                                    </Col>
                                    <Col span={11} offset={1}>
                                        {this.props.t("Output")}:
                                        <CopyableCode code={value.outputData}/>
                                    </Col>
                                </Row>
                            </>
                        )
                    })
                }
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
    const content = (NowPro.content as ProgramContent)
    return {
        testCase: content.testCase
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(SampleTestCase))