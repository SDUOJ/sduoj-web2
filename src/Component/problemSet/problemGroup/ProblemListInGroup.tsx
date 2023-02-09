import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Form} from "antd";
import CellEditTable from "../../common/Table/CellEditTable";
import React from "react";
import ObjectiveForm from "../Form/ObjectiveForm";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";
import mApi from "../../../Utils/API/m-api";
import objectiveGet from "../dataConvert/objectiveGet";
import objectiveSubmit from "../dataConvert/objectiveSubmit";
import SubjectiveForm from "../Form/SubjectiveForm";
import SubjectiveConfigForm from "../Form/SubjectiveConfigForm";
import subjectiveGet from "../dataConvert/subjectiveGet";
import {isValueEmpty} from "../../../Utils/empty";
import ItemProblemAdd from "../../problem/From/Item/ItemProblemAdd";
import {PlusOutlined} from "@ant-design/icons";


const ProblemListInGroup = (props: any) => {

    const tableColumns: any = [
        {
            title: 'ID',
            dataIndex: 'pid',
            tooltip: '题目ID',
            editable: false,
            width: "50px"
        },
        {
            title: '内容预览',
            tooltip: '仅展示前80字，题目全部内容可以点击编辑查看',
            readonly: true,
            editable: false,
            render: (rows: any) => {
                if (rows.detail === undefined) rows.detail = {preview: rows.preview}
                return rows.detail.preview
            }
        },
        {
            title: '分数',
            dataIndex: 'score',
            editable: true,
            valueType: 'digit'
        }
    ]
    if (props.type !== 0) {
        tableColumns.push({
            title: '查重系数',
            dataIndex: 'antiCheatingRate',
            editable: true,
            tooltip: '不填即为不查重，查重系数应在 0.4 - 1 之间',
            valueType: 'digit'
        })
    }
    if (props.type === 2) {
        tableColumns.push({
            title: '限制提交数',
            dataIndex: 'submitLimit',
            editable: true,
            tooltip: '不填即为不限制提交',
            valueType: 'digit'
        })
    }

    tableColumns.push({
        title: '操作',
        valueType: 'option',
        render: () => {
            return null;
        },
    })


    return (
        <>
            {props.type === 2 && (
                <ItemProblemAdd
                    name={"problemInfo"}
                    label={"题目列表"}
                    editable={true}
                    problemType={"program"}
                    useSubmitLimit={true}
                    useAntiCheating={true}
                    initNewLine={(data: any[], keyMapping:any) => {
                        const length = data.length
                        const last = length === 0 ? undefined : data[data.length - 1]
                        const code = isValueEmpty(last?.[keyMapping["ProblemCode"]]) ? undefined : last?.[keyMapping["ProblemCode"]]
                        const score = last?.[keyMapping["ProblemScore"]]
                        const submitNumber = last?.[keyMapping["ProblemSubmitNumber"]]
                        const number = code === undefined ? 0 : parseInt(code.substr(-4))
                        const NewCode = code === undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
                        return {
                            id: Date.now(),
                            [keyMapping["ProblemCode"]]: NewCode,
                            [keyMapping["ProblemScore"]]: score,
                            [keyMapping["ProblemSubmitNumber"]]: submitNumber,
                        }
                    }}
                    keyMapping={{
                        ProblemCode: "pid",
                        ProblemAlias: "name",
                        defaultDescriptionId: "desId",
                        ProblemScore: "score",
                        ProblemSubmitNumber: "submitLimit"
                    }}
                />
            )}
            {props.type !== 2 && (
                <Form.Item name={"problemInfo"} label={"题目列表"}>
                    <CellEditTable
                        columns={tableColumns}
                        rowKey={"pid"}
                        toolBar={(actionRef: any) => {
                            if (props.type === 0) {
                                // 客观题
                                return [<ModalFormUseForm
                                    width={900}
                                    type={"create"}
                                    btnProps={{block: true}}
                                    btnType={"dashed"}
                                    title={"新建客观题"}
                                    subForm={[{component: <ObjectiveForm type={"create"}/>, label: ""}]}
                                    formName={"ProblemObjectForm"}
                                    dataSubmitter={(value: any) => {
                                        let data = objectiveSubmit(value)
                                        if (data == null) return Promise.reject()
                                        return mApi.createObjective({...data, gid: props.gid})
                                    }}
                                    afterSubmit={(data: any) => {
                                        actionRef.current?.addEditRecord?.({
                                            ...data
                                        }, {newRecordType: "dataSource"});
                                    }}
                                />]
                            } else if (props.type === 1) {
                                return [<ModalFormUseForm
                                    width={900}
                                    type={"create"}
                                    btnProps={{block: true}}
                                    btnType={"dashed"}
                                    title={"新建主观题"}
                                    subForm={[
                                        {component: <SubjectiveForm type={"create"}/>, label: "基本信息"},
                                        {component: <SubjectiveConfigForm/>, label: "评测信息"}
                                    ]}
                                    formName={"ProblemSubjectForm"}
                                    dataSubmitter={(value: any) => {
                                        return mApi.createSubjective({...value, gid: props.gid})
                                    }}
                                    afterSubmit={(data: any) => {
                                        actionRef.current?.addEditRecord?.({
                                            ...data
                                        }, {newRecordType: "dataSource"});
                                    }}
                                />]
                            }
                        }}
                        rowButton={(row: any, value: any, onChange: any) => {
                            if (props.type === 0) {
                                // 客观题
                                return [
                                    <ModalFormUseForm
                                        width={900}
                                        type={"update"}
                                        title={"编辑"}
                                        subForm={[{component: <ObjectiveForm type={"update"}/>, label: ""}]}
                                        formName={"ProblemObjectForm"}
                                        updateAppendProps={{gid: props.gid, pid: row.pid}}
                                        dataLoader={async () => {
                                            return mApi.getObjective({
                                                gid: props.gid,
                                                pid: row.pid
                                            }).then((resData: any) => {
                                                let data = objectiveGet(resData)
                                                return Promise.resolve(data)
                                            })
                                        }}
                                        dataSubmitter={(value: any) => {
                                            let data = objectiveSubmit(value)
                                            if (data == null) return Promise.reject()
                                            return mApi.editObjective(data)
                                        }}
                                        afterSubmit={(data: any) => {
                                            value = value.map((v: any) => {
                                                if (v.pid === row.pid) v.detail = data
                                                return v
                                            })
                                            onChange(value)
                                        }}
                                    />
                                ]
                            } else if (props.type === 1) {
                                // 主观题
                                return [
                                    <ModalFormUseForm
                                        width={900}
                                        type={"update"}
                                        title={"编辑"}
                                        subForm={[
                                            {component: <SubjectiveForm type={"update"}/>, label: "基本信息"},
                                            {component: <SubjectiveConfigForm/>, label: "评测信息"}
                                        ]}
                                        formName={"ProblemSubjectForm"}
                                        updateAppendProps={{gid: props.gid, pid: row.pid}}
                                        dataLoader={async () => {
                                            return mApi.getSubjective({
                                                gid: props.gid,
                                                pid: row.pid
                                            }).then((resData: any) => {
                                                return Promise.resolve(subjectiveGet(resData))
                                            })
                                        }}
                                        dataSubmitter={(value: any) => {
                                            return mApi.editSubjective(value)
                                        }}
                                        afterSubmit={(data: any) => {
                                            value = value.map((v: any) => {
                                                if (v.pid === row.pid) v.detail = data
                                                return v
                                            })
                                            onChange(value)
                                        }}
                                    />
                                ]
                            }
                            return []
                        }}
                    />
                </Form.Item>
            )}

        </>
    )
}

export default withTranslation()(withRouter(ProblemListInGroup))
