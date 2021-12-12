import React, {Dispatch, useState} from "react";
import {Col, Form, List, Row, Input, DatePicker} from "antd";
import {InfoCircleOutlined} from "@ant-design/icons"
import {withTranslation} from "react-i18next";
import Meta from "antd/lib/card/Meta";
import TextArea from "antd/lib/input/TextArea";
import {connect} from "react-redux";
import {examBasicType, ManageState} from "../../../Type/IManage";
import {withRouter} from "react-router";

const {RangePicker} = DatePicker;

const ExamBaseForm = (props: any) => {
    // 页面表单的操作引用
    const formRef = props.getRef();

    // === State ===
    // 考试描述
    const [examDescription, setExamDescription] = useState<string[]>([]);

    return (
        <>
            <Form
                initialValues={props.examBasicInfo === undefined ? undefined : {
                    examTitle: props.examBasicInfo.examTitle,
                    examStartEndTime: props.examBasicInfo.examStartEndTime,
                    examDescription: props.examBasicInfo.examDescription
                }}
                layout={"vertical"}
                ref={formRef}
                onValuesChange={(changedValues: any, values: examBasicType) => {
                    if (changedValues.examDescription !== undefined) {
                        setExamDescription(
                            changedValues.examDescription.split('\n').filter((value: string) => value != "")
                        )
                    }
                }}
            >
                <Form.Item
                    name="examTitle"
                    label="标题"
                    rules={[{required: true}]}
                >
                    <Input placeholder="请输入考试标题"/>
                </Form.Item>
                <Row>
                    <Col span={11}>
                        <Form.Item
                            name="examStartEndTime"
                            label="考试起止时间"
                            rules={[{type: 'array' as const, required: true}]}
                        >
                            <RangePicker showTime/>
                        </Form.Item>
                    </Col>
                    <Col span={11} offset={1}>
                        <Meta title={"考试时长"} description={
                            <span> 暂不支持 </span>
                        } className={"exam-form-preview"}/>
                    </Col>

                </Row>

                <Row>
                    <Col span={11}>
                        <Form.Item
                            name="examDescription"
                            label="描述"
                            rules={[{required: true}]}
                            tooltip={{title: '每一行会生成为一项', icon: <InfoCircleOutlined/>}}
                        >
                            <TextArea rows={4} placeholder="请输入考试描述"/>
                        </Form.Item>
                    </Col>
                    <Col span={11} offset={1}>
                        {
                            [''].map(() => {
                                if (!(examDescription.length == 0 || (examDescription.length == 1 && examDescription[0].length == 0))) {
                                    return (
                                        <Meta title={"预览"} description={
                                            <List
                                                size="small"
                                                dataSource={examDescription}
                                                renderItem={
                                                    (item: string, index) => {
                                                        return (
                                                            <List.Item>{index + 1}. <span>{item}</span></List.Item>
                                                        )
                                                    }
                                                }
                                            />
                                        } className={"exam-form-preview"}/>
                                    )
                                }
                            })
                        }
                    </Col>
                </Row>
            </Form>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ManageState = state.ManageReducer
    return {
        examBasicInfo: State.examData.examBasicInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ExamBaseForm)))
