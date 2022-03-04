import {Collapse, Form, Input, Radio, Select, Switch} from "antd";
import React, {useEffect, useState} from "react";
import BodyChecker from "./Item/BodyChecker";
import mApi from "Utils/API/m-api"
import ItemSwitch from "../../common/Form/Item/ItemSwitch";
import ItemCodeEditor from "../../common/Form/Item/ItemCodeEditor";
import TableWithSelection from "../../common/Table/TableWithSelection";

const FormJudgeType = (props: any) => {
    const [value, setValue] = React.useState(0);
    const onChange = (e: any) => {
        setValue(e.target.value);
    };

    const [judgeTemplateInfo, setJudgeTemplateInfo] = useState<any[]>([])
    const [useFuncTemplate, setUseFuncTemplate] = useState<boolean>(false)
    const [selectedJudgeTemplate, setSelectJudgeTemplate] = useState<number[]>([])

    useEffect(() => {
        mApi.getJudgeTemplateList({type: 0, problemCode: ""}).then((value: any) => {
            setJudgeTemplateInfo(value)
        })
    }, [])

    return (
        <>
            <Form.Item label={"类型"} required>
                <Radio.Group onChange={onChange} value={value}>
                    <Radio value={0}>IO模式</Radio>
                    <Radio value={2}>高级模式</Radio>
                </Radio.Group>
            </Form.Item>
            {(value === 0) && (
                <>
                    <Form.Item label={"评测语言"} name={"judgeTemplates"} required>
                        <Select mode={"multiple"} value={selectedJudgeTemplate} onChange={setSelectJudgeTemplate}>
                            {judgeTemplateInfo !== undefined && judgeTemplateInfo.map((value: any) => {
                                return <Select.Option value={value.id}>{value.id + ": " + value.title}</Select.Option>
                            })}
                        </Select>
                    </Form.Item>

                    <div style={{marginBottom: 20}}>
                        函数模板<br/>
                        <Switch
                            checked={useFuncTemplate}
                            onChange={setUseFuncTemplate}
                            checkedChildren={"使用"}
                            unCheckedChildren={"不使用"}
                        />
                    </div>
                    {useFuncTemplate && (
                        <>
                            <Collapse
                                accordion
                                className={"ProblemAddChecker"}
                                style={{marginBottom: 20}}
                            >
                                {selectedJudgeTemplate.map((value: any) => {
                                    let templateName = ""
                                    judgeTemplateInfo.forEach(v => value === v.id && (templateName = v.id + ": " + v.title))
                                    return (
                                        <Collapse.Panel header={templateName} key={value} forceRender={true}>
                                            <ItemSwitch
                                                name={["functionTemplates", value, "isShowFunctionTemplate"]}
                                                label={"模板"} InitValue={true} required={true}
                                                ck={"显示"} unck={"不显示"}
                                            />
                                            <ItemCodeEditor
                                                label={"模板代码"} required={true} lang={"text"}
                                                name={["functionTemplates", value, "functionTemplate"]}/>
                                            <ItemCodeEditor
                                                label={"初始化代码"} required={true} lang={"text"}
                                                name={["functionTemplates", value, "initialTemplate"]}/>
                                            <Form.Item
                                                name={["functionTemplates", value, "judgeTemplateId"]}
                                                initialValue={value}
                                                style={{display: "none"}}>
                                                <Input/>
                                            </Form.Item>
                                        </Collapse.Panel>
                                    )
                                })}
                            </Collapse>
                        </>
                    )}
                </>
            )}
            {value === 0 && (
                <>
                    <Form.Item label={"比较器"} name={"checkerConfig"} required>
                        <BodyChecker/>
                    </Form.Item>
                </>


            )}
            {value === 2 && (
                <>
                    暂不支持
                </>
            )}
        </>
    )
}

export default FormJudgeType