import React, {Component, Dispatch} from 'react';
import {ProgramContent, TestCase} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {Col, Row, Space} from "antd";
import Paragraph from "antd/lib/typography/Paragraph";
import CopyableCode from "../submission/CopyableCode";
import Title from "antd/lib/typography/Title";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";


class SampleTestCase extends Component<any, any> {

    render() {
        return (
            <>
                {
                    this.props.testCase.map((value: TestCase, index: number) => {
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
    const NowGroup = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1];
    const NowPro = (NowGroup.proList as SProInfo[])[State.TopProblemIndex - 1]
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