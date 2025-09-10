import {Collapse, Form, Input, Radio, Select, Space, Switch, Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import BodyChecker from "./Item/BodyChecker";
import mApi from "Utils/API/m-api"
import ItemSwitch from "../../common/Form/Item/ItemSwitch";
import ItemCodeEditor from "../../common/Form/Item/ItemCodeEditor";
import {ManageState} from "../../../Type/IManage";
import {connect} from "react-redux";
import {useTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {isValueEmpty} from "../../../Utils/empty";
import TemplateMForm from "../../judgeTemplate/Form/TemplateMForm";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";
import FormExtraInfo from "../../common/Form/FormExtraInfo";

const FormJudgeType = (props: any) => {
    const { t } = useTranslation();
    const [JudgeType, setJudgeType] = useState(0);
    const onChange = (e: any) => {
        setJudgeType(e.target.value);
    };

    const [judgeTemplateInfo, setJudgeTemplateInfo] = useState<any[]>([])
    const [useFuncTemplate, setUseFuncTemplate] = useState<boolean>(false)
    const [selectedJudgeTemplate, setSelectJudgeTemplate] = useState<number[]>([])

    const [rowSelection, setRowSelection] = useState<any>(undefined)
    const [AdvancedJT, setAdvancedJT] = useState<any>([])

    useEffect(() => {
        mApi.getJudgeTemplateList({type: 0, problemCode: ""}).then((value: any) => {
            setJudgeTemplateInfo(value)
        })
    }, [])

    const updateAdvanced = () => {
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
        <Form.Item label={t("Type")} required>
                <Radio.Group onChange={onChange} value={JudgeType}>
            <Radio value={0}>{t('IOMode')}</Radio>
            <Radio value={2}>{t('AdvancedMode')}</Radio>
                </Radio.Group>
            </Form.Item>
            {(JudgeType === 0) && (
                <>
                    <Form.Item
                        label={t('Language')}
                        name={"judgeTemplates"}
                        rules={[{required: true, message: t('LanguageNotSet')}]} 
                    >
                        <Select mode={"multiple"} value={selectedJudgeTemplate} onChange={setSelectJudgeTemplate}>
                            {judgeTemplateInfo !== undefined && judgeTemplateInfo.map((value: any) => {
                                return <Select.Option value={value.id}>{value.id + ": " + value.title}</Select.Option>
                            })}
                        </Select>
                    </Form.Item>

                    <div style={{marginBottom: 20}}>
                        {t('FunctionTemplate')}<br/>
                        <Switch
                            checked={useFuncTemplate}
                            onChange={setUseFuncTemplate}
                            checkedChildren={t('Use')}
                            unCheckedChildren={t('NotUse')}
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
                                                label={t('TemplateCodeVisibility')} InitValue={true}
                                                ck={t('Show')} unck={t('Hide')}
                                            />
                                            <ItemCodeEditor
                                                label={t('TemplateCode')} lang={"text"}
                                                name={["functionTemplates", value, "functionTemplate"]}/>
                                            <ItemCodeEditor
                                                label={t('InitialCode')} lang={"text"}
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
                    <Form.Item label={t('Comparator')} name={"checkerConfig"} required>
                        <BodyChecker/>
                    </Form.Item>
                </>
            )}
            {JudgeType === 2 && (
                <>
                    {props.initData["ProblemInfo"]?.problemCode === undefined && (
                        t('AdvancedJudgeTemplateHint')
                    )}
                    {props.initData["ProblemInfo"]?.problemCode !== undefined && (
                        <>
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
                                    {title: t('Title'), dataIndex: "title"},
                                    {title: t('Comment'), dataIndex: "comment"},
                                    {
                                        title: t('operator'), render: (text: any, rows: any) => {
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
                                                    title={t('CreateTemplateClone', {title: rows.title})}
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
                            <div style={{marginTop: 24}}>
                                <ModalFormUseForm
                                    btnProps={{size: "small"}}
                                    width={600}
                                    title={t('CreateTemplate')}
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
                        </>

                    )}
                    <Form.Item name={"judgeTemplates"} hidden>
                        <FormExtraInfo
                            v={rowSelection}
                            setV={setRowSelection}
                            eqs={(a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)}
                        />
                    </Form.Item>
                </>
            )}
        </>
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
)(withRouter(FormJudgeType))
