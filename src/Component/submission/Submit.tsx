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
import {fileUpload, fileUploadWithoutMD5} from "../../Utils/fileUpload";
import {MaxCodeLength} from "../../Config/constValue";
import {UserState} from "../../Type/Iuser";
import {functionTemplate} from "../../Type/types";


export interface SubmitPropsType {
    API: any        // API 接口函数
    title: string   // 对话框的标题
    TopSubmissionInfo: TopSubmissionInfoType    // 当前提交的题目信息
    LeftSubmitCount?: number                    // 剩余提交次数
    JudgeTemplates: JudgeTemplateAllType[]      // 评测模板
    FuncTemplates: any
}

const Submit = (props: SubmitPropsType & any) => {

    const [form] = Form.useForm();

    const [SubmitModalVis, setSubmitModalVis] = useState<boolean>(false)
    const [SubmitDisable, setSubmitDisable] = useState<boolean>(false)
    const [judgeTemplateId, setJudgeTemplateId] = useState<number | undefined>()
    const [zipFileId, setZipFileId] = useState<string | undefined>()


    const CodeSubmit = () => {
        let gb_hide: any;
        form.validateFields().then((value) => {
            setSubmitDisable(true)
            // if (props.FuncTemplates !== undefined) {
            //     let fid = props.FuncTemplates.findIndex((v: any) => {
            //         return v.judgeTemplateId === value.JudgeTemplate
            //     })
            //     if (fid !== -1) {
            //         const funcTemplate: functionTemplate = props.FuncTemplates[fid]
            //         if (funcTemplate.functionTemplate !== undefined)
            //             value.code = funcTemplate.functionTemplate + value.code
            //     }
            // }
            gb_hide = message.info("正在排队提交，请耐心等待", 0)
            return props.API(value.JudgeTemplate, value.code, zipFileId).then((data: any) => {
                props.setTopSubmission(data, props.TopSubmissionInfo)
                setSubmitModalVis(false)
                setSubmitDisable(false)
                props.setSubmissionModalVis(true)
                props.SubmissionListName !== undefined && props.addTableVersion(props.SubmissionListName)
                gb_hide && gb_hide()
            }).catch(() => {
                gb_hide && gb_hide()
            })
        }).catch((err: any) => {
            gb_hide && gb_hide()
            setSubmitDisable(false)
        })
    }

    const SubmitButton = (
        <Button
            type={"primary"}
            onClick={() => {
                if (!props.isLogin) message.error("请登录")
                else setSubmitModalVis(true)
            }}
            disabled={
                (props.LeftSubmitCount !== undefined && props.LeftSubmitCount <= 0)
            }
        >
            {props.t("Submit")}
        </Button>
    )
    // console.log("props.LeftSubmitCount", props.LeftSubmitCount)
    return (
        <>
            {!isNaN(props.LeftSubmitCount) && props.LeftSubmitCount !== undefined && (
                <Badge count={
                    <Tooltip placement="topLeft" title={"剩余提交次数"}>
                        <span className={"Badge-Tooltip-Program"}>
                            {props.LeftSubmitCount}
                        </span>
                    </Tooltip>
                }>
                    {SubmitButton}
                </Badge>
            )}
            {(isNaN(props.LeftSubmitCount) || props.LeftSubmitCount === undefined) && (
                SubmitButton
            )}

            <Modal title={props.title}
                   visible={SubmitModalVis}
                   destroyOnClose={true}
                   onCancel={() => {
                       setSubmitModalVis(false)
                   }}
                   width={1200}
                   footer={[
                       <Space size={25}>
                           {
                               props.LeftSubmitCount !== undefined &&
                               !isNaN(props.LeftSubmitCount) && (
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
                                   (!isNaN(props.LeftSubmitCount) &&
                                       props.LeftSubmitCount !== undefined &&
                                       props.LeftSubmitCount <= 0)
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
                    preserve={false}
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
                            if (jtId !== undefined && props.JudgeTemplates !== undefined) {
                                let accept = "", num = 0
                                for (const x of props.JudgeTemplates[jtId].acceptFileExtensions) {
                                    if (num !== 0) accept += ','
                                    if (x[0] === '.') accept += x
                                    else accept += '.' + x
                                    num += 1
                                }
                                if (props.JudgeTemplates[jtId].acceptFileExtensions.findIndex((value: string) => value === "zip" || value === ".zip") === -1) {
                                    // 正常的代码提交形式
                                    const tid = props.JudgeTemplates[jtId].id
                                    let fid
                                    if (props.FuncTemplates !== undefined &&
                                        (fid = props.FuncTemplates.findIndex((value: any) => {
                                            return value.judgeTemplateId === tid
                                        })) !== -1) {
                                        const funcTemplate: functionTemplate = props.FuncTemplates[fid]
                                        form.setFieldsValue({
                                            ...form.getFieldsValue(),
                                            code: funcTemplate.initialTemplate
                                        })
                                        return (
                                            <>
                                                {funcTemplate.isShowFunctionTemplate === 1 && (
                                                    <Form.Item label={"起始代码"}>
                                                        <pre>起始代码为只读模式，将在编译前被插入到答案代码的上方</pre>
                                                        <CodeEditor
                                                            lang={JudgeTemplate2lang(jtId)}
                                                            value={funcTemplate.functionTemplate} readOnly={true}/>
                                                    </Form.Item>
                                                )}
                                                <Form.Item label={"答案代码"} name={"code"}>
                                                    <CodeEditor lang={JudgeTemplate2lang(jtId)}/>
                                                </Form.Item>
                                            </>
                                        )
                                    } else {
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
                                                                    const str = event.target?.result as string
                                                                    if (str.length > MaxCodeLength)
                                                                        message.error("上传文件字符数超过" + MaxCodeLength)
                                                                    form.setFieldsValue({
                                                                        ...form.getFieldsValue(),
                                                                        code: str.substr(0, MaxCodeLength)
                                                                    })
                                                                } catch (e) {
                                                                    message.error('文件解析失败！');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Button icon={<UploadOutlined/>}>上传</Button>
                                                    </Upload>
                                                </Form.Item>

                                                <Form.Item label={"代码"} name={"code"}>
                                                    <CodeEditor lang={JudgeTemplate2lang(jtId)}/>
                                                </Form.Item>
                                            </>
                                        )
                                    }
                                } else {
                                    // 自定义 JudgeTemplate 的提交
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
                                                    fileUploadWithoutMD5(file, (value: any) => {
                                                        setZipFileId(value.id)
                                                    })
                                                }}
                                            >
                                                <Button icon={<UploadOutlined/>}>上传</Button>
                                            </Upload>
                                        </Form.Item>
                                    )

                                }
                            }
                            return undefined
                        })
                    }
                </Form>
            </Modal>
        </>
    )

}

const mapStateToProps = (state: any) => {
    const State: UserState = state.UserReducer
    return {
        isLogin: State.isLogin
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
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