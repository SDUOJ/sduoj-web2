import {Collapse, Form, Input, Radio, Select, Space, Switch, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import BodyChecker from "./Item/BodyChecker";
import mApi from "Utils/API/m-api"
import ItemSwitch from "../../common/Form/Item/ItemSwitch";
import ItemCodeEditor from "../../common/Form/Item/ItemCodeEditor";
import {ManageState} from "../../../Type/IManage";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {isValueEmpty} from "../../../Utils/empty";
import TemplateMForm from "../../judgeTemplate/Form/TemplateMForm";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";

const FormJudgeType = (props: any) => {
    const [JudgeType, setJudgeType] = useState(0);
    const onChange = (e: any) => {
        setJudgeType(e.target.value);
    };

    const [judgeTemplateInfo, setJudgeTemplateInfo] = useState<any[]>([])
    const [useFuncTemplate, setUseFuncTemplate] = useState<boolean>(false)
    const [selectedJudgeTemplate, setSelectJudgeTemplate] = useState<number[]>([])

    const [rowSelection, setRowSelection] = useState<any>([])
    const [AdvancedJT, setAdvancedJT] = useState<any>([])

    useEffect(() => {
        mApi.getJudgeTemplateList({type: 0, problemCode: ""}).then((value: any) => {
            setJudgeTemplateInfo(value)
        })
    }, [])

    const updateAdvanced = ()=>{
        const initData = props.initData["ProblemInfo"]
        const problemCode = initData.problemCode

        mApi.getJudgeTemplateList({type: 2, problemCode: problemCode}).then((value: any) => {
            if (value.length !== 0) {
                setAdvancedJT(value)
            }
        })
    }


    useEffect(() => {
        // console.log("props.initData", props.initData)
        if (props.initData !== undefined && props.initData["ProblemInfo"] !== undefined) {
            const initData = props.initData["ProblemInfo"]

            // 设定当前评测模板
            if (!isValueEmpty(initData.judgeTemplates)) setSelectJudgeTemplate(initData.judgeTemplates)

            // 设定函数模板的使用
            if (!isValueEmpty(initData.functionTemplates) && Object.keys(initData.functionTemplates).length !== 0) {
                // console.log("functionTemplates", initData.functionTemplates)
                setUseFuncTemplate(true)
            }

            const problemCode = initData.problemCode
            const loadAdvanced = () => {
                // 请求绑定当前题目的 jt
                mApi.getJudgeTemplateList({type: 2, problemCode: problemCode}).then((value: any) => {
                    if (value.length !== 0) {
                        // 设定当前为高级模式
                        setJudgeType(2)
                        setAdvancedJT(value)
                        setRowSelection(initData.judgeTemplates)
                    }
                })
            }

            // 等待IO模板请求完成之后，如果发现 IO 模板没有，或者发现模板列表中的第一个不是 IO 模板，则按照高级模板处理
            if (judgeTemplateInfo.length !== 0) {
                if (!isValueEmpty(initData.judgeTemplates) && initData.judgeTemplates.length !== 0) {
                    const jt = initData.judgeTemplates[0]
                    if (judgeTemplateInfo.findIndex(value => value.id === jt) === -1) loadAdvanced()
                } else {
                    loadAdvanced()
                }


            }
        }
    }, [props.initData, judgeTemplateInfo])


    return (
        <>
            <Form.Item label={"类型"} required>
                <Radio.Group onChange={onChange} value={JudgeType}>
                    <Radio value={0}>IO模式</Radio>
                    <Radio value={2}>高级模式</Radio>
                </Radio.Group>
            </Form.Item>
            {(JudgeType === 0) && (
                <>
                    <Form.Item
                        label={"语言"}
                        name={"judgeTemplates"}
                        rules={[{required: true, message: "未设置语言"}]}
                    >
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
                                                label={"模板代码可见性"} InitValue={true}
                                                ck={"显示"} unck={"不显示"}
                                            />
                                            <ItemCodeEditor
                                                label={"模板代码"} lang={"text"}
                                                name={["functionTemplates", value, "functionTemplate"]}/>
                                            <ItemCodeEditor
                                                label={"初始化代码"} lang={"text"}
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
            {JudgeType === 0 && (
                <>
                    <Form.Item label={"比较器"} name={"checkerConfig"} required>
                        <BodyChecker/>
                    </Form.Item>
                </>
            )}
            {JudgeType === 2 && (
                <>
                    {props.initData["ProblemInfo"]?.problemCode === undefined && (
                        "高级评测模板需要在创建后进行添加"
                    )}
                    {props.initData["ProblemInfo"]?.problemCode !== undefined && (
                        <Table
                            size={"small"}
                            pagination={false}
                            rowSelection={{
                                selectedRowKeys: rowSelection,
                                onChange: (selectedRowKeys: React.Key[]) => {
                                    setRowSelection(selectedRowKeys)
                                }
                            }}
                            rowKey={"id"}
                            columns={[
                                {title: "ID", dataIndex: "id"},
                                {title: "标题", dataIndex: "title"},
                                {title: "注释", dataIndex: "comment"},
                                {
                                    title: "操作", render: (text: any, rows: any) => {
                                        return <Space size={3}>
                                            <ModalFormUseForm
                                                width={600}
                                                title={rows.title}
                                                type={"update"}
                                                subForm={[{component: <TemplateMForm/>, label: ""},]}
                                                dataLoader={async () => {
                                                    return mApi.getOneTemplate({id: rows.id}).then((value: any) => {
                                                        return Promise.resolve(value)
                                                    })
                                                }}
                                                updateAppendProps={{id: rows.id}}
                                                afterSubmit={updateAdvanced}
                                                dataSubmitter={(value: any) => {
                                                    return mApi.updateTemplate({type: 2, ...value})
                                                }}
                                            />
                                            <ModalFormUseForm
                                                width={600}
                                                title={"新建模板(克隆自" + rows.title + ")"}
                                                type={"fork"}
                                                subForm={[{component: <TemplateMForm/>, label: ""}]}
                                                dataLoader={async () => {
                                                    return mApi.getOneTemplate({id: rows.id}).then((value: any) => {
                                                        return Promise.resolve(value)
                                                    })
                                                }}
                                                afterSubmit={updateAdvanced}
                                                dataSubmitter={(value: any) => {
                                                    return mApi.createTemplate({
                                                        problemCode: props.initData["ProblemInfo"].problemCode,
                                                        type: 2, ...value
                                                    })
                                                }}
                                            />
                                        </Space>
                                    }
                                }
                            ]}
                            dataSource={AdvancedJT}
                        />
                    )}
                    <div style={{marginTop: 24}}>
                        <ModalFormUseForm
                            btnProps={{size: "small"}}
                            width={600}
                            title={"新建模板"}
                            type={"create"}
                            subForm={[{component: <TemplateMForm/>, label: ""}]}
                            afterSubmit={updateAdvanced}
                            dataSubmitter={(value: any) => {
                                return mApi.createTemplate({
                                    problemCode: props.initData["ProblemInfo"].problemCode,
                                    type: 2, ...value
                                })
                            }}
                        />
                    </div>
                    <div style={{display: "none"}}>
                        <Form.Item name={"judgeTemplates"}>
                            <JudgeTemplateRowSelected rowSelection={rowSelection} setRowSelection={setRowSelection}/>
                        </Form.Item>
                    </div>
                </>
            )}
        </>
    )
}

const JudgeTemplateRowSelected = (props: any) => {
    const {value, onChange} = props

    useEffect(() => {
        if (props.rowSelection !== undefined && JSON.stringify(value) !== JSON.stringify(props.rowSelection))
            onChange(props.rowSelection)
    }, [props.rowSelection])

    useEffect(() => {
        if (value !== undefined && JSON.stringify(value) !== JSON.stringify(props.rowSelection))
            props.setRowSelection(value)
    }, [value])

    return (
        <></>
    )
}


const mapStateToProps = (state: any) => {
    const MState: ManageState = state.ManageReducer
    return {
        initData: MState.manageInitData
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(withRouter(FormJudgeType))
)