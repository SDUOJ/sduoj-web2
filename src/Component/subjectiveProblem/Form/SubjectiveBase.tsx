import {withTranslation} from "react-i18next";
import ItemTitle from "../../common/Form/Item/ItemTitle";
import ItemSwitch01 from "../../common/Form/Item/ItemSwitch01";
import {Col, Form, InputNumber, Row, Select} from "antd";
import ItemSelectGroup from "../../group/Form/Item/ItemSelectGroup";
import React, {useState} from "react";
import FormExtraInfo from "../../common/Form/FormExtraInfo";

const SubjectiveBase = (props: any) => {

    const [fileType, setFileType] = useState<any>(0)
    const [accept, setAccept] = useState<string[]>([])

    const getAcceptString = ()=>{
        if(accept.length === 0) return undefined
        let res = ""
        for (let x of accept) {
            if (res.length !== 0) res += ","
            res += x
        }
        return res
    }

    return (
        <>
            <ItemTitle/>
            <ItemSwitch01 name={"isPublic"} label={"是否公开"} ck={"是"} unck={"否"}/>
            <Form.Item name={"allowFile"} hidden>
                <FormExtraInfo v={fileType} setV={setFileType} eqs={(a: any, b: any) => a === b}/>
            </Form.Item>
            <Form.Item label={"提交类型"}>
                <Select value={fileType} onChange={(value, option) => {
                    setFileType(value)
                }}>
                    <Select.Option value={0}> Markdown </Select.Option>
                    <Select.Option value={1}> 文件 </Select.Option>
                </Select>
            </Form.Item>
            {fileType === 0 && (
                <>
                    <Form.Item name={"wordLimit"} label={"文本最大长度"}>
                        <InputNumber/>
                    </Form.Item>
                </>
            )}
            {fileType === 1 && (
                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item label={"文件类型"} help={"请填写文件后缀名，如：.pdf, .docx"}>
                            <Select mode="tags" value={accept} onChange={(value, option) => {
                                setAccept(value)
                            }}>
                            </Select>
                        </Form.Item>
                        <Form.Item name={"fileType"} hidden>
                            <FormExtraInfo
                                v={getAcceptString()}
                                setV={(v: any) => {
                                    let res: string[] = []
                                    for (let x of v.split(','))  res.push(x)
                                    setAccept(res)
                                }}
                                eqs={(a: any, b: any) => {
                                    // console.log("a", a, "b", b)
                                    return a === b
                                }}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name={"fileSizeLimit"} label={"文件大小限制(MB)"}>
                            <InputNumber/>
                        </Form.Item>
                    </Col>
                </Row>
            )}
            <ItemSelectGroup label={"管理组"} name={"managerGroups"} mode={"multiple"} formName={"SubjectiveForm"}/>
        </>
    )
}

export default withTranslation()(SubjectiveBase)