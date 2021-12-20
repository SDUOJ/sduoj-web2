import React, {Component, Dispatch} from "react";
import {Button, Form, FormInstance, message, Modal, Select, Space, Tabs, Upload} from "antd";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";
import {JudgeTemplate, ProblemState, ProgramContent} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {
    setTopSubmission,
} from "../../Redux/Action/submission";
import {Option} from "antd/lib/mentions";
import {UploadOutlined} from "@ant-design/icons"
import CodeEditor from "../common/CodeEditor";
import TextArea from "antd/lib/input/TextArea";
import {ConfigState} from "../../Type/IConfig";
import {withRouter} from "react-router-dom";
import {examID} from "../../Type/types";
import eApi from "../../Utils/API/e-api";
import {TopSubmissionInfoType} from "../../Type/ISubmission";

const {TabPane} = Tabs;

class Submit extends Component<any, any> {
    formRef = React.createRef<FormInstance>();


    constructor(props: any) {
        super(props);
        this.state = {
            SubmitModalVis: false,
            SubmitDisable: false
        }
        this.CodeSubmit = this.CodeSubmit.bind(this)
    }

    CodeSubmit() {
        this.formRef.current!.validateFields().then(
            () => {
                this.formRef.current?.validateFields().then((value) => {
                    this.setState({SubmitDisable: true})
                    const judgeTemplateId = value.JudgeTemplate
                    const code = value.CodeEditor
                    eApi.CreateSubmit({
                        code: code,
                        judgeTemplateId: judgeTemplateId,
                        problemCode: this.props.ProblemCode,
                        problemIndex: parseInt(this.props.ProblemCode),
                        groupIndex: this.props.groupId,
                        examId: this.props.match.params.eid
                    }).then((resData) => {
                        message.success("提交成功")
                        this.props.setTopSubmission(resData, {
                            title: this.props.title,
                            TimeLimit: this.props.Time,
                            MemoryLimit: this.props.Memory,
                            sumScore: this.props.sumScore
                        })
                        this.setState({SubmitModalVis: false})
                        this.props.setSubmissionModalVis(true)
                        this.setState({SubmitDisable: false})
                    })
                })
            }
        )
    }

    render() {
        return (
            <>
                <Button
                    type={"primary"}
                    onClick={() => {
                        this.setState({SubmitModalVis: true})
                    }}
                    disabled={this.props.LeftSubmitCount <= 0 || this.state.SubmitDisable}
                >
                    {this.props.t("Submit")}
                </Button>
                <Modal title={this.props.SubmitModalTitle}
                       visible={this.state.SubmitModalVis}
                       onCancel={() => {
                           this.setState({SubmitModalVis: false})
                       }}
                       width={1200}
                       footer={[
                           <Space size={25}>
                               <div style={{color: "red", fontSize: "15px", marginBottom: "10px", margin: "0px auto"}}>
                                   剩余提交次数：{this.props.LeftSubmitCount}
                               </div>
                               <Button
                                   key="submit" type="primary"
                                   loading={this.props.SubmitLoading}
                                   onClick={this.CodeSubmit}
                                   disabled={this.props.LeftSubmitCount <= 0}
                               >
                                   提交
                               </Button>
                               <Button key="back" onClick={() => {
                                   this.setState({SubmitModalVis: false})
                               }}>
                                   取消
                               </Button>
                           </Space>
                       ]}
                >


                    <Form ref={this.formRef} onFinish={this.CodeSubmit} layout={"vertical"}>
                        <Form.Item name={"JudgeTemplate"} label={this.props.t("template")} rules={[{required: true}]}>
                            <Select
                                allowClear>
                                {
                                    this.props.JudgeTemplate !== undefined && this.props.JudgeTemplate.map((val: JudgeTemplate) => {
                                        return (
                                            <Option value={val.tid.toString()}>{val.name}</Option>
                                        )
                                    })
                                }
                            </Select>
                        </Form.Item>
                        <Tabs defaultActiveKey="1">
                            <TabPane tab="代码提交" key="1">
                                <Form.Item label={"代码"} name={"CodeEditor"} rules={[{required: true}]}>
                                    <TextArea rows={25} showCount maxLength={1024 * 10}/>
                                </Form.Item>
                            </TabPane>
                            <TabPane tab="文件提交（暂不可用）" key="2" disabled={true}>
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
    const CState: ConfigState = state.ConfigReducer
    switch (CState.mode) {
        case "exam":
            const EState: ExamState = state.ExamReducer
            const NowGroup = (EState.proGroupInfo as SProGroupInfo[])[EState.TopGroupIndex - 1];
            const NowPro = (NowGroup.proList as SProInfo[])[EState.TopProblemIndex - 1]
            const NowContent = (NowPro.content as ProgramContent)

            return {
                SubmitModalTitle: NowContent?.title,
                JudgeTemplate: NowContent?.JudgeTemplate,
                ProblemCode: EState.TopProblemIndex - 1,
                groupId: EState.TopGroupIndex - 1,
                Time: NowContent?.TimeLimit,
                Memory: NowContent?.MemoryLimit,
                title: NowContent?.title,
                sumScore: NowContent?.SumScore
            }

    }
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setTopSubmission: (submissionID: string, submissionInfo: TopSubmissionInfoType) => dispatch({
        type: "setTopSubmission",
        submissionID: submissionID,
        submissionInfo: submissionInfo
    }),
    setSubmissionModalVis: (data: boolean) => dispatch({type: "setSubmissionModalVis", data: data})

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Submit)))