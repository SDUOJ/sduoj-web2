import React, {Component} from "react";
import {Card, Space} from "antd";
import MApi from "../../../Utils/API/m-api";
import mApi from "../../../Utils/API/m-api";
import TableWithPagination from "../../../Component/common/Table/TableWithPagination";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import ModalFormUseForm from "../../../Component/common/Form/ModalFormUseForm";
import ItemTitle from "../../../Component/common/Form/Item/ItemTitle";
import ItemSwitch from "../../../Component/common/Form/Item/ItemSwitch";
import ItemSelectGroup from "../../../Component/group/Form/Item/ItemSelectGroup";
import ItemText from "../../../Component/common/Form/Item/ItemText";
import FormJudgeType from "../../../Component/problem/From/FormJudgeType";
import ProDescriptions from "../../../Component/problem/ProDescriptions";
import ProCheckPoints from "../../../Component/problem/ProCheckPoints";

class MProblem extends Component<any, any> {
    render() {

        const beforeSubmit = (value: any) => {
            value.isPublic = (value.isPublic ? 1 : 0)
            if (value.functionTemplates === undefined) value.functionTemplates = {}
            const functionTemplates = []
            for (const x in value.functionTemplates) {
                functionTemplates.push({
                    ...value.functionTemplates[x],
                    isShowFunctionTemplate: value.functionTemplates[x].isShowFunctionTemplate ? 1 : 0
                })
            }
            value.functionTemplates = functionTemplates

            return value
        }
        const beforeUse = (value: any) => {
            if (value.managerGroups === null) value.managerGroups = []
            if (value.judgeTemplates === null) value.judgeTemplates = []
            if (value.functionTemplates !== undefined) {
                const functionTemplates: any = {}
                for (const x of value.functionTemplates) functionTemplates[x.judgeTemplateId] = {...x}
                value.functionTemplates = functionTemplates
            }
            return value
        }

        const ProblemForm = [
            {
                component: (
                    <>
                        <ItemTitle name={"problemTitle"} label={"题目标题"}/>
                        <ItemSwitch name={"isPublic"} label={"公开"}/>
                        <ItemText name={"source"} label={"来源"} required={false}/>
                        <ItemSelectGroup name={"managerGroups"} label={"管理组"}
                                         mode={"multiple"} formName={"ProblemInfo"}/>
                    </>
                ),
                label: "基本信息"
            },
            {
                component: (
                    <>
                        <ItemText name={"timeLimit"} label={"时间限制"} addonAfter={"ms"}
                                  initialValue={1000}/>
                        <ItemText name={"memoryLimit"} label={"空间限制"} addonAfter={"KB"}
                                  initialValue={256 * 1024}/>
                        <ItemText name={"outputLimit"} label={"输出限制"} addonAfter={"KB"}
                                  initialValue={100 * 1024}/>
                    </>
                ),
                label: "评测限制"
            },
            {
                component: <FormJudgeType/>,
                label: "评测方式"
            },
        ]

        let colData: any[] = [
            {
                title: "ID",
                dataIndex: "problemId",
                width: 50,
                responsive: ["lg", "sm"]
            },
            {
                title: "题号",
                dataIndex: "problemCode",
                width: "auto",
                responsive: ["lg", "sm", "xs"]
            },
            {
                title: "标题",
                dataIndex: "problemTitle",
                width: "auto",
                responsive: ["lg", "sm", "xs"],
            },
            {
                title: "时间限制",
                dataIndex: "timeLimit",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return <>{Math.floor(parseInt(text) / 1000)}s ({text}ms)</>
                }
            },
            {
                title: "内存限制",
                dataIndex: "memoryLimit",
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: string) => {
                    return <>{Math.floor(parseInt(text) / 1024)}MB ({text}KB)</>
                }
            },
            {
                title: "AC/提交",
                width: "auto",
                responsive: ["lg"],
                render: (text: string, row: any) => {
                    return <>{row.acceptNum} / {row.submitNum}</>
                }
            },
            {
                title: "来源",
                dataIndex: "source",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: "作者",
                dataIndex: "username",
                width: "auto",
                responsive: ["lg"],
            },
            {
                title: this.props.t("operator"),
                width: "auto",
                responsive: ["lg", "sm"],
                render: (text: any, rows: any) => {
                    return (
                        <Space size={3}>
                            <ModalFormUseForm
                                TableName={"ProblemList"}
                                width={600}
                                title={rows.problemCode}
                                type={"update"}
                                formName={"ProblemInfo"}
                                subForm={ProblemForm}
                                updateAppendProps={{problemCode: rows.problemCode}}
                                dataSubmitter={(value: any) => {
                                    value = beforeSubmit(value)
                                    return mApi.updateProblemInfo(value)
                                }}
                                dataLoader={async () => {
                                    return mApi.getProblem({problemCode: rows.problemCode}).then((value: any) => {
                                        value = beforeUse(value)
                                        return Promise.resolve(value)
                                    })
                                }}
                            />
                            <ModalFormUseForm
                                TableName={"ProblemList"}
                                width={600}
                                title={"新建题目(克隆自" + rows.problemCode + ")"}
                                type={"fork"}
                                formName={"ProblemInfo"}
                                subForm={ProblemForm}
                                dataSubmitter={(value: any) => {
                                    value = beforeSubmit(value)
                                    return mApi.createProblem(value)
                                }}
                                dataLoader={async () => {
                                    return mApi.getProblem({problemCode: rows.problemCode}).then((value: any) => {
                                        value = beforeUse(value)
                                        return Promise.resolve(value)
                                    })
                                }}
                            />
                            <ProDescriptions
                                problemCode={rows.problemCode}
                                title={rows.problemTitle}
                                defaultDescriptionId={rows.defaultDescriptionId}
                            />
                            <ProCheckPoints
                                problemCode={rows.problemCode}
                                title={rows.problemTitle}
                            />
                        </Space>
                    )
                }
            }
        ]


        return (
            <div style={{marginTop: -20, overflow: "hidden"}}>
                <Card size={"small"} bordered={true} title={"题目列表"} extra={
                    <>
                        <ModalFormUseForm
                            TableName={"ProblemList"}
                            width={600}
                            title={"新建题目"}
                            type={"create"}
                            subForm={ProblemForm}
                            dataSubmitter={(value: any) => {
                                value = beforeSubmit(value)
                                return mApi.createProblem(value)
                            }}
                        />
                    </>
                }
                >
                    <TableWithPagination
                        search={true}
                        columns={colData}
                        API={MApi.getProblemList}
                        size={"small"}
                        name={"ProblemList"}
                        rowKey={"problemId"}
                    />
                </Card>
            </div>
        )
    }
}

export default withTranslation()(withRouter(MProblem))