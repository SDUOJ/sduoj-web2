import React, {Dispatch, useEffect, useState} from "react";
import {Col, DatePicker, Form, FormInstance, Input, Radio, Row, Skeleton} from "antd";
import {InfoCircleOutlined} from "@ant-design/icons"
import {useTranslation} from "react-i18next";
import Meta from "antd/lib/card/Meta";
import {connect} from "react-redux";
import {withRouter} from "react-router";
import moment from "moment";
import {TimeDiff} from "../../../Utils/Time";
import {examBasicType} from "../../../Type/IExam";
import Editor from "../../common/Editor";

const {RangePicker} = DatePicker;

const ExamBaseForm = (props: any) => {
    const { t } = useTranslation();
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
                        label={t("title")}
                        rules={[{required: true, message: t("fieldRequired")} ]}
                    >
                        <Input placeholder={t("PleaseInputExamTitle", {defaultValue: t("title")})}/>
                    </Form.Item>
                    <Row gutter={10}>
                        <Col span={6}>
                            <Form.Item
                                name="scoreMod"
                                label={t("ScoreDisplayMode")}
                                rules={[{required: true, message: t("fieldRequired")} ]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: t('Show'), value: "show"},
                                        {label: t('PartialShow'), value: "partial"},
                                        {label: t('Hide'), value: "disable"},
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="caseMod"
                                label={t("CheckpointDisplayMode")}
                                rules={[{required: true, message: t("fieldRequired")} ]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: t('Show'), value: "show"},
                                        {label: t('PartialShow'), value: "partial"},
                                        {label: t('Hide'), value: "disable"},
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                name="openReport"
                                label={t("ExamReportAfterExam")}
                                rules={[{required: true, message: t("fieldRequired")} ]}
                            >
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    options={[
                                        {label: t('Enabled'), value: 1},
                                        {label: t('Disabled'), value: 0}
                                    ]}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row>
                        <Col span={11}>
                            <Form.Item
                                name="examStartEndTime"
                                label={t("ExamTimeRange")}
                                rules={[{type: 'array' as const, required: true, message: t("fieldRequired")} ]}
                                tooltip={{title: t('ExamTimeRangeHint'), icon: <InfoCircleOutlined/>}}
                            >
                                <RangePicker
                                    showTime={{minuteStep: 5, secondStep: 30}}
                                    format={"YYYY-MM-DD HH:mm:ss"}
                                    disabled={props.isStart}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={11} offset={1}>
                            <Meta title={t("ExamDuration") } description={
                                [''].map(() => {
                                    if (examTime?.length === 2) {
                                        return TimeDiff(examTime[0].unix() * 1000, examTime[1].unix() * 1000)
                                    }
                                    return undefined
                                })
                            } className={"exam-form-preview"}/>
                        </Col>
                    </Row>

                    <Form.Item
                        name="examDescription"
                        label={t("Description")}
                        rules={[{required: true, message: t("fieldRequired")} ]}
                    >
                        <Editor height={400}/>
                    </Form.Item>

                </Form>
            </Skeleton>
        </>
    )
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamBaseForm))
