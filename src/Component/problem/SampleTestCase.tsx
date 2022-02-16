import React, {Component, Dispatch} from 'react';
import {ProgramContent, TestCase} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {Col, Row, Skeleton} from "antd";
import CopyableCode from "../submission/CopyableCode";
import Title from "antd/lib/typography/Title";


class SampleTestCase extends Component<any, any> {
    render() {
        return (
            <Skeleton active loading={this.props.testCase === undefined}>
                {
                    this.props.testCase !== undefined && (
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
                    )
                }
            </Skeleton>
        )
    }
}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(SampleTestCase))