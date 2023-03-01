import {Button, Card, Col, Form, Input, InputNumber, Row, Select, Space} from "antd";
import MApi from "../../Utils/API/m-api";
import {withRouter} from "react-router-dom";
import ModalFormUseForm from "../../Component/common/Form/ModalFormUseForm";
import TableWithPagination from "../../Component/common/Table/TableWithPagination";
import {withTranslation} from "react-i18next";
import mApi from "Utils/API/m-api"
import ItemTitle from "../../Component/common/Form/Item/ItemTitle";
import ItemSelectGroup from "../../Component/group/Form/Item/ItemSelectGroup";
import ItemText from "../../Component/common/Form/Item/ItemText";
import ItemEditor from "../../Component/common/Form/Item/ItemEditor";
import ItemTimeRange from "../../Component/common/Form/Item/ItemTimeRange";
import React, {useEffect, useState} from "react";
import ItemSwitch01 from "../../Component/common/Form/Item/ItemSwitch01";
import FormExtraInfo from "../../Component/common/Form/FormExtraInfo";
import SwitchX from "../../Component/common/Form/Item/SwitchX";
import ItemTimeSetting from "../../Component/common/Form/Item/ItemTimeSetting";
import CellEditTable from "../../Component/common/Table/CellEditTable";
import TimeSettingX from "../../Component/common/Form/Item/TimeSettingX";
import {PlusOutlined} from "@ant-design/icons";
import problemSetGet from "../../Component/problemSet/dataConvert/problemSetGet";
import problemSetSubmit from "../../Component/problemSet/dataConvert/problemSetSubmit";


const MProblemSet = (props: any) => {

    const [type, setType] = useState()
    const [useGlobalTime, setUseGlobalTime] = useState(1)
    const [useReport, setUseReport] = useState()
    const [usePractice, setUsePractice] = useState()

    const [pidValueEnum, setPidValueEnum] = useState()

    const clearStates = () => {
        setType(undefined)
        setUseReport(undefined)
        setUseGlobalTime(1)
        setUsePractice(undefined)
    }


    useEffect(() => {
        if (pidValueEnum === undefined) {
            const getType = (tp: number) => {
                if (tp === 0)
                    return props.t("ObjectiveQuestions")
                else if (tp === 1)
                    return props.t("SubjectiveQuestions")
                else if (tp === 2)
                    return props.t("ProgrammingQuestions")
            }
            mApi.getProblemGroupSearch({search: ""}).then((res: any) => {
                let data: any = []
                for (let x of res) {
                    data.push({
                        label: x.name + "(" + getType(x.type) + ")",
                        value: x.gid
                    })
                }
                setPidValueEnum(data)
            })
        }
    }, [pidValueEnum])

    const tableColumns: any = [
        {
            title: '题组编号',
            dataIndex: 'gid',
            editable: true,
            valueType: 'select',
            fieldProps: {
                options: pidValueEnum
            },
            width: "240px"
        },
        {
            title: '题组别名',
            dataIndex: 'name',
            editable: true,
            valueType: 'text',
            width: "240px"

        },
        {
            title: '分值',
            dataIndex: 'score',
            editable: true,
            valueType: 'digit',
            width: "120px"
        }
    ]

    if (useGlobalTime !== 1) {
        tableColumns.push({
            title: "时间配置",
            dataIndex: "answer",
            editable: true,
            renderFormItem: () => <TimeSettingX/>
        })
    }

    tableColumns.push({
        title: '操作',
        valueType: 'option',
        render: () => {
            return null;
        },
        width: "120px"
    })

    const ProblemSetForm = [
        {
            component: <>
                <ItemTitle name={"name"}/>
                <Form.Item hidden name={"type"} required>
                    <FormExtraInfo v={type} setV={setType} eqs={(a: any, b: any) => a === b}/>
                </Form.Item>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item label={"题单模式"} required>
                            <Select options={[
                                {value: 0, label: "练习模式"},
                                {value: 1, label: "考试模式"},
                            ]} onChange={setType} value={type}/>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <ItemText name={"tag"} label={"标签"} help={"例如：作业、实验、练习，用于在 group 分类显示"}/>
                    </Col>
                </Row>
                <ItemSelectGroup
                    label={"管理组"}
                    name={"manageGroupId"}
                    formName={"ProblemSetForm"}
                />
                <Row gutter={24}>
                    <Col span={16}>
                        <ItemSelectGroup
                            label={"作答组"}
                            name={"groupId"}
                            formName={"ProblemSetForm"} required={true}/>
                    </Col>
                    <Col span={8}>
                        <Form.Item name={"global_score"} label={"组内分数"} help={"该题组在课程中的成绩"}>
                            <InputNumber/>
                        </Form.Item>
                    </Col>
                </Row>
                <ItemEditor name={"description"} label={"题单描述"}/>
            </>,
            label: "基本信息"
        },
        {
            component: <>

                <Row gutter={24}>
                    {/*<Col span={6}>*/}
                        <Form.Item name={["config", "useSameSE"]} hidden>
                            <FormExtraInfo v={useGlobalTime} setV={setUseGlobalTime} eqs={(a: any, b: any) => a === b}/>
                        </Form.Item>
                        {/*<Form.Item label={"使用统一时间"}>*/}
                        {/*    <SwitchX ck={"是"} unck={"否"} value={useGlobalTime} onChange={setUseGlobalTime}/>*/}
                        {/*</Form.Item>*/}

                    {/*</Col>*/}
                    <Col span={18}>
                        {useGlobalTime === 1 && (
                            <ItemTimeRange label="起止时间" required={true} startName={"tm_start"} endName={"tm_end"}/>
                        )}
                    </Col>
                </Row>
                <Row gutter={24}>
                    <Col span={6}>
                        <Form.Item name={["config", "showReport"]} hidden>
                            <FormExtraInfo v={useReport} setV={setUseReport} eqs={(a: any, b: any) => a === b}/>
                        </Form.Item>
                        <Form.Item label={"开启总结报告"}>
                            <SwitchX ck={"是"} unck={"否"} value={useReport} onChange={setUseReport}/>
                        </Form.Item>
                    </Col>
                    {useReport === 1 && (
                        <>
                            <Col span={6}>
                                <ItemSwitch01 label={"客观题答案"} ck={"显示"} unck={"隐藏"} required={true}
                                              name={["config", "showObjectiveAnswer"]}/>
                            </Col>
                            <Col span={6}>
                                <ItemSwitch01 label={"主观题答案"} ck={"显示"} unck={"隐藏"} required={true}
                                              name={["config", "showSubjectiveAnswer"]}/>
                            </Col>
                            <Col span={6}>
                                <ItemSwitch01 label={"主观题评测细节"} ck={"显示"} unck={"隐藏"} required={true}
                                              name={["config", "showSubjectiveJudgeLog"]}
                                />
                            </Col>
                        </>
                    )}
                </Row>

                {useGlobalTime === 1 && (
                    <>
                        <Form.Item name={["config", "usePractice"]} hidden>
                            <FormExtraInfo v={usePractice} setV={setUsePractice} eqs={(a: any, b: any) => a === b}/>
                        </Form.Item>
                        <Form.Item label={"赛后补题"}>
                            <SwitchX ck={"开"} unck={"关"} value={usePractice} onChange={setUsePractice}/>
                        </Form.Item>
                        {usePractice === 1 && (
                            <>
                                <Form.Item
                                    name={["config", "practiceScoreCalculate"]}
                                    label={"补题分数公式"}
                                    help={"两个变量：e，p 表示限时成绩与练习成绩，书写 python 表达式计算"}
                                >
                                    <Input/>
                                </Form.Item>
                                <ItemTimeSetting name={["config", "practiceTimeSetting"]} label={"补题时间设置"}/>
                            </>

                        )}
                    </>
                )}
                <Row gutter={24}>
                    <Col span={8}>
                        <ItemSwitch01
                            name={["config", "showScoreInRunning"]}
                            label={"限时中显示分值"} ck={"是"} unck={"否"} required={true}/>
                    </Col>
                    <Col span={8}>
                        <ItemSwitch01
                            name={["config", "showProgramScoreInRunning"]}
                            label={"限时中显示编程题得分"} ck={"是"} unck={"否"} required={true}/>
                    </Col>
                    <Col span={8}>
                        <ItemSwitch01
                            name={["config", "mergerSubjectiveGroup"]}
                            label={"合并批阅主观题"} ck={"是"} unck={"否"} required={true}/>
                    </Col>
                </Row>

            </>,
            label: "配置选项"
        },
        {
            component: <>
                <Form.Item name={"groupInfo"} label={"题组配置"}>
                    <CellEditTable
                        columns={tableColumns}
                        rowKey={"id"}
                        toolBar={(actionRef: any) => {
                            return [
                                <Button
                                    type={"dashed"}
                                    block
                                    icon={<PlusOutlined/>}
                                    onClick={() => {
                                        actionRef.current?.addEditRecord?.({
                                            id: Date.now()
                                        }, {newRecordType: "dataSource"});
                                    }}
                                >{"新增题组"}</Button>
                            ]
                        }}
                        rowButton={() => []}
                    />
                </Form.Item>
            </>,
            label: "题组列表"
        }
    ]


    const colData: any[] = [
        {
            title: "ID",
            dataIndex: "psid",
            width: 64,
            responsive: ["lg", "sm", "xs"]
        },
        {
            title: "标题",
            dataIndex: "name",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: "标签",
            dataIndex: "tag",
            width: "auto",
            responsive: ["lg", "sm"],
        },
        {
            title: "类型",
            dataIndex: "type",
            width: "auto",
            responsive: ["lg", "sm"],
            render: (tp: number) => {
                if (tp === 0) return "练习"
                if (tp === 1) return "考试"
            }
        },
        // {
        //     title: props.t("StartTime"),
        //     dataIndex: "gmtStart",
        //     width: "auto",
        //     responsive: ["lg", "sm"],
        //     render: (text: string) => {
        //         return unix2Time(parseInt(text))
        //     }
        // },
        // {
        //     title: "持续时间",
        //     width: "auto",
        //     responsive: ["lg", "sm"],
        //     render: (text: string, rows: any) => {
        //         return TimeDiff(rows.gmtStart, rows.gmtEnd)
        //     }
        // },
        {
            title: props.t("Owner"),
            dataIndex: "username",
            width: "auto",
            responsive: ["lg", "sm", "xs"],
        },
        {
            title: props.t("operator"),
            width: "200px",
            render: (text: any, rows: any) => {
                return (
                    <Space>
                        <ModalFormUseForm
                            TableName={"ProblemSetList"}
                            width={1200}
                            title={"编辑(" + rows.name + ")"}
                            type={"update"}
                            subForm={ProblemSetForm}
                            formName={"ProblemSetForm"}
                            updateAppendProps={{psid: rows.psid}}
                            dataLoader={async () => {
                                return mApi.getProblemSetInfo({psid: rows.psid}).then((value: any) => {
                                    return Promise.resolve(problemSetGet(value))
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                let data = problemSetSubmit(value)
                                if (data === null) return Promise.reject()
                                return mApi.editProblemSet(data)
                            }}
                            onClose={() => {
                                clearStates()
                            }}
                        />
                        <ModalFormUseForm
                            TableName={"ProblemSetList"}
                            width={1200}
                            title={"新建题单(克隆自" + rows.name + ")"}
                            type={"fork"}
                            subForm={ProblemSetForm}
                            formName={"ProblemSetForm"}
                            dataLoader={async () => {
                                return mApi.getProblemSetInfo({psid: rows.psid}).then((value: any) => {
                                    return Promise.resolve(problemSetGet(value))
                                })
                            }}
                            dataSubmitter={(value: any) => {
                                let data = problemSetSubmit(value)
                                if (data === null) return Promise.reject()
                                return mApi.createProblemSet(data)
                            }}
                            onClose={() => {
                                clearStates()
                            }}
                        />
                    </Space>
                )
            }
        }
    ]

    return (
        <div style={{marginTop: -20, overflow: "hidden"}}>
            <Card
                size={"small"}
                bordered={true}
                title={"主观题列表"}
                extra={
                    <Space>
                        <ModalFormUseForm
                            TableName={"ProblemSetList"}
                            width={1200}
                            title={"新建题单"}
                            type={"create"}
                            subForm={ProblemSetForm}
                            initData={{
                                config: {
                                    usePractice: 0,
                                    useSameSE: 1,
                                    showReport: 0
                                }
                            }}
                            dataSubmitter={(value: any) => {
                                let data = problemSetSubmit(value)
                                if (data === null) return Promise.reject()
                                return mApi.createProblemSet(data)
                            }}
                            onClose={() => {
                                clearStates()
                            }}
                        />
                    </Space>
                }
            >
                <TableWithPagination
                    name={"ProblemSetList"}
                    columns={colData}
                    API={MApi.getProblemSetList}
                    size={"small"}
                />
            </Card>
        </div>
    )
}

export default withTranslation()(withRouter(MProblemSet))
