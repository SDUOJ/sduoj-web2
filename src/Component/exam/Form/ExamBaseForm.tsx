import React, {Dispatch, useEffect, useState} from "react";
import {Col, DatePicker, Form, FormInstance, Input, List, Radio, Row, Skeleton} from "antd";
import {InfoCircleOutlined} from "@ant-design/icons"
import {withTranslation} from "react-i18next";
import Meta from "antd/lib/card/Meta";
import TextArea from "antd/lib/input/TextArea";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import moment from "moment";
import {TimeDiff} from "../../../Utils/Time";
import {examBasicType} from "../../../Type/IExam";
import Editor from "../../common/Editor";

const {RangePicker} = DatePicker;

const ExamBaseForm = (props: any) => {
    // 页面表单的操作引用
    const formRef: React.RefObject<FormInstance<any>> = props.getRef();

    // === State ===
    // 考试描述
    const [examTime, setExamTime] = useState<moment.Moment[]>();

    useEffect(() => {
        if (props.initData !== undefined) {
            if (props.initData.examStartEndTime !== undefined)
                setExamTime(props.initData.examStartEndTime)
        }
    }, [props.initData])

    return (
        <>
            <Skeleton active loading={!props.isDataLoad}>
                <Form
                    initialValues={props.initData}
                    layout={"vertical"}
                    ref={formRef}
                    onValuesChange={(changedValues: any, values: examBasicType) => {
                        if (changedValues.examStartEndTime !== undefined) {
                            setExamTime(changedValues.examStartEndTime)
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
                    <Row gutter={10}>
                        <Col span={6}>
                            <Form.Item
                                name="scoreMod"
                                label="提交页面分数显示模式"
                                rules={[{required: true}]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: '显示', value: "show"},
                                        {label: '部分显示', value: "partial"},
                                        {label: '不显示', value: "disable"},
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="caseMod"
                                label="测试点显示模式"
                                rules={[{required: true}]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: '显示', value: "show"},
                                        {label: '部分显示', value: "partial"},
                                        {label: '不显示', value: "disable"},
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="openReport"
                                label="考试后成绩报告"
                                rules={[{required: true}]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: '开启', value: 1},
                                        {label: '关闭', value: 0}
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row>
                        <Col span={11}>
                            <Form.Item
                                name="examStartEndTime"
                                label="考试起止时间"
                                rules={[{type: 'array' as const, required: true}]}
                                tooltip={{title: '考试起止时间无法在考试开始后修改', icon: <InfoCircleOutlined/>}}
                            >
                                <RangePicker
                                    showTime={{minuteStep: 5, secondStep: 30}}
                                    format={"YYYY-MM-DD HH:mm:ss"}
                                    disabled={props.isStart}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={11} offset={1}>
                            <Meta title={"考试时长"} description={
                                [''].map(() => {
                                    if (examTime?.length === 2) {
                                        return TimeDiff(examTime[0].unix() * 1000, examTime[1].unix() * 1000)
                                    }
                                })
                            } className={"exam-form-preview"}/>
                        </Col>
                    </Row>

                    <Form.Item
                        name="examDescription"
                        label="描述"
                        rules={[{required: true}]}
                    >
                        <Editor height={400}/>
                    </Form.Item>

                </Form>
            </Skeleton>
        </>
    )
}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ExamBaseForm)))
