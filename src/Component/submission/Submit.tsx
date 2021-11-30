import React, {Component, Dispatch} from "react";
import {Button, Form, FormInstance, Modal, Select, Tabs, Upload} from "antd";
import {ExamState} from "../../Type/IExam";
import {JudgeTemplate, ProblemState} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {
    CloseSubmitModal,
    OpenSubmitModal,
    SubmitToGetSubmissionIDTodo
} from "../../Redux/Action/problem";
import {getJudgeTemplate, getProblemTitle} from "../../Redux/Reducer/exam";
import {Option} from "antd/lib/mentions";
import {UploadOutlined} from "@ant-design/icons"
import CodeEditor from "../common/CodeEditor";
import TextArea from "antd/lib/input/TextArea";
import {ConfigState} from "../../Type/IConfig";

const {TabPane} = Tabs;

class Submit extends Component<any, any> {
    formRef = React.createRef<FormInstance>();


    constructor(props: any) {
        super(props);
        this.CodeSubmit = this.CodeSubmit.bind(this)
    }

    CodeSubmit() {
        this.formRef.current!.validateFields().then(
            () => {
                const judgeTemplateId = this.formRef.current!.getFieldValue("JudgeTemplate")
                const code = this.formRef.current!.getFieldValue("CodeEditor")
                this.props.SubmitToGetSubmissionID(judgeTemplateId, code, this.props.ProblemCode)
            }
        )
    }

    render() {
        return (
            <>
                <Button type={"primary"} onClick={this.props.OpenSubmitModal}>{this.props.t("Submit")}</Button>
                <Modal title={this.props.SubmitModalTitle}
                       visible={this.props.SubmitModalVis}
                       onCancel={this.props.CloseSubmitModal}
                       width={1200}
                       footer={[
                           <Button key="back" onClick={this.props.CloseSubmitModal}>
                               取消
                           </Button>,
                           <Button key="submit" type="primary"
                                   loading={this.props.SubmitLoading}
                                   onClick={this.CodeSubmit}>
                               提交
                           </Button>
                       ]}
                >

                    <Form ref={this.formRef} onFinish={this.CodeSubmit} layout={"vertical"}>
                        <Form.Item name={"JudgeTemplate"} label={this.props.t("template")} required>
                            <Select
                                allowClear>
                                {
                                    this.props.JudgeTemplate.map((val: JudgeTemplate) => {
                                        return (
                                            <Option value={val.tid.toString()}>{val.name}</Option>
                                        )
                                    })
                                }
                            </Select>
                        </Form.Item>
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="代码提交" key="1">
                                <Form.Item name={"CodeEditor"}>
                                    <TextArea rows={25} showCount maxLength={1024 * 10}/>
                                </Form.Item>
                            </TabPane>
                            <TabPane tab="文件提交" key="2">
                                <Form.Item name={"FileUpload"}>
                                    <Upload>
                                        <Button icon={<UploadOutlined/>}>上传文件</Button>
                                    </Upload>
                                </Form.Item>
                            </TabPane>
                        </Tabs>
                    </Form>
                </Modal>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ProblemState = state.ProblemReducer
    const CState: ConfigState = state.ConfigReducer
    switch (CState.mode) {
        case "exam":
            const EState: ExamState = state.ExamReducer
            return {
                SubmitModalVis: State.SubmitModalVis,
                SubmitModalTitle: getProblemTitle(EState.proInfo, EState.TopProblemIndex),
                JudgeTemplate: getJudgeTemplate(EState.proInfo, EState.TopProblemIndex),
                ProblemCode: EState.TopProblemIndex
            }
    }
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    OpenSubmitModal: () => dispatch({
        type: "OpenSubmitModal",
    }),
    CloseSubmitModal: () => dispatch({
        type: "CloseSubmitModal",
    }),
    SubmitToGetSubmissionID: (judgeTemplateId: string,
                              code: string,
                              problemCode: string) => dispatch(
        SubmitToGetSubmissionIDTodo({
            code: code,
            judgeTemplateId: judgeTemplateId,
            problemCode: problemCode
        })
    )


})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(Submit))