import React, {Dispatch, useState} from "react";
import {Badge, Button, Form, message, Modal, Select, Space, Tooltip, Upload} from "antd";
import {JudgeTemplate, JudgeTemplateAllType} from "../../Type/IProblem";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {setTopSubmission,} from "../../Redux/Action/submission";
import {Option} from "antd/lib/mentions";
import {UploadOutlined} from "@ant-design/icons"
import CodeEditor from "../common/CodeEditor";
import {withRouter} from "react-router-dom";
import {TopSubmissionInfoType} from "../../Type/ISubmission";
import {JudgeTemplate2lang} from "../../Utils/JudgeTemplate2lang";
import {fileUpload} from "../../Utils/fileUpload";


export interface SubmitPropsType {
    data: any       // 除了 code 和 templateId 之外的其他参数
    API: any        // API 接口函数
    title: string   // 对话框的标题
    TopSubmissionInfo: TopSubmissionInfoType    // 当前提交的题目信息
    LeftSubmitCount?: number                    // 剩余提交次数
    JudgeTemplates: JudgeTemplateAllType[]      // 评测模板
}

const Submit = (props: SubmitPropsType & any) => {

    const [form] = Form.useForm();

    const [SubmitModalVis, setSubmitModalVis] = useState<boolean>(false)
    const [SubmitDisable, setSubmitDisable] = useState<boolean>(false)
    const [judgeTemplateId, setJudgeTemplateId] = useState<number | undefined>()
    const [code, setCode] = useState<string | undefined>()
    const [CodeMirror, setCodeMirror] = useState<string | undefined>()
    const [zipFileId, setZipFileId] = useState<string | undefined>()


    const CodeSubmit = () => {
        form.validateFields().then((value) => {
            setSubmitDisable(true)
            let codex = CodeMirror
            if ((codex === undefined || codex === null || codex.length === 0) && zipFileId === undefined) {
                message.error("代码不能为空")
                return
            }
            let newData = props.data
            newData['judgeTemplateId'] = value.JudgeTemplate
            if (zipFileId !== undefined) {
                newData['zipFileId'] = zipFileId
            } else {
                newData['code'] = codex
            }
            props.API(newData).then((data: any) => {
                props.setTopSubmission(data, props.TopSubmissionInfo)
                setSubmitModalVis(false)
                setSubmitDisable(false)
                props.setSubmissionModalVis(true)
            })
        })
    }


    return (
        <>
            <Badge count={
                <Tooltip placement="topLeft" title={"剩余提交次数"}>
                    <span className={"Badge-Tooltip-Program"}>
                        {props.LeftSubmitCount}
                    </span>
                </Tooltip>
            }>
                <Button
                    type={"primary"}
                    onClick={() => {
                        setSubmitModalVis(true)
                    }}
                    disabled={
                        (props.LeftSubmitCount !== undefined && props.LeftSubmitCount <= 0)
                        || SubmitDisable
                    }
                >
                    {props.t("Submit")}
                </Button>
            </Badge>
            <Modal title={props.title}
                   visible={SubmitModalVis}
                   onCancel={() => {
                       setSubmitModalVis(false)
                   }}
                   width={1200}
                   footer={[
                       <Space size={25}>
                           {
                               props.LeftSubmitCount !== undefined && (
                                   <div style={{
                                       color: "red",
                                       fontSize: "15px",
                                       marginBottom: "10px",
                                       margin: "0px auto"
                                   }}>
                                       剩余提交次数：{props.LeftSubmitCount}
                                   </div>
                               )
                           }
                           <Button
                               key="submit" type="primary"
                               onClick={CodeSubmit}
                               disabled={
                                   (props.LeftSubmitCount !== undefined && props.LeftSubmitCount <= 0)
                                   || SubmitDisable
                               }
                           >
                               提交
                           </Button>
                           <Button key="back" onClick={() => {
                               setSubmitModalVis(false)
                           }}>
                               取消
                           </Button>
                       </Space>
                   ]}
            >
                <Form
                    form={form}
                    onFinish={async () => {
                        CodeSubmit()
                    }}
                    layout={"vertical"}

                >
                    <Form.Item name={"JudgeTemplate"} label={props.t("template")} rules={[{required: true}]}>
                        <Select
                            allowClear
                            onChange={(value, option) => {
                                const id = props.JudgeTemplates.findIndex((val: any) => val.id === value)
                                setJudgeTemplateId(id >= 0 ? id : undefined)
                            }}
                        >
                            {
                                props.JudgeTemplates !== undefined && props.JudgeTemplates.map((val: JudgeTemplateAllType) => {
                                    return (
                                        <Option value={val.id}>{val.title}</Option>
                                    )
                                })
                            }
                        </Select>
                    </Form.Item>
                    {
                        [''].map(() => {
                            const jtId = judgeTemplateId
                            if (jtId !== undefined) {
                                let accept = "", num = 0
                                for (const x of props.JudgeTemplates[jtId].acceptFileExtensions) {
                                    if (num !== 0) accept += ','
                                    if (x[0] === '.') accept += x
                                    else accept += '.' + x
                                    num += 1
                                }
                                if (props.JudgeTemplates[jtId].acceptFileExtensions.findIndex((value: string) => value === "zip" || value === ".zip") === -1) {
                                    // 正常的代码提交形式
                                    return (
                                        <>
                                            <Form.Item label={"文件"}>
                                                <Upload
                                                    multiple={false}
                                                    accept={accept}
                                                    customRequest={(obj: any) => {
                                                        obj.onSuccess((body: any) => {
                                                        })
                                                    }}
                                                    listType={"text"}
                                                    beforeUpload={(file: any) => {
                                                        const fileReader = new FileReader();
                                                        fileReader.readAsText(file);
                                                        fileReader.onload = (event) => {
                                                            try {
                                                                setCode(event.target?.result as string)
                                                            } catch (e) {
                                                                message.error('文件解析失败！');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Button icon={<UploadOutlined/>}>上传</Button>
                                                </Upload>
                                            </Form.Item>

                                            <Form.Item label={"代码"}>
                                                <CodeEditor
                                                    lang={JudgeTemplate2lang(jtId)}
                                                    code={code} save={setCodeMirror}/>
                                            </Form.Item>
                                        </>
                                    )
                                } else {
                                    return (
                                        <Form.Item label={"文件"}>
                                            <Upload
                                                multiple={false}
                                                accept={accept}
                                                customRequest={(obj: any) => {
                                                    obj.onSuccess((body: any) => {
                                                    })
                                                }}
                                                listType={"text"}
                                                beforeUpload={(file) => {
                                                    fileUpload([file], (value: any) => {
                                                        setZipFileId(value.id)
                                                    })
                                                }}
                                            />
                                        </Form.Item>
                                    )

                                }
                            }
                        })
                    }
                </Form>
            </Modal>
        </>
    )

}

const mapStateToProps = (state: any) => {
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
)(withTranslation()(
    withRouter(Submit)
))