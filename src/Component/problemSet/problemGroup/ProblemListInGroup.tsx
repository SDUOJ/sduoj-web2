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


const ProblemListInGroup = (props: any) => {

    const tableColumns: any = [
        {
            title: 'ID',
            dataIndex: 'pid',
            tooltip: props.t('problemCode'),
            editable: false,
            width: "50px"
        },
        {
            title: props.t('ContentPreview'),
            tooltip: props.t('ContentPreviewTooltip'),
            readonly: true,
            editable: false,
            render: (rows: any) => {
                if (rows.detail === undefined) rows.detail = {preview: rows.preview}
                return rows.detail.preview
            }
        },
        {
            title: props.t('Score'),
            dataIndex: 'score',
            editable: true,
            valueType: 'digit'
        }
    ]
    if (props.type !== 0) {
        tableColumns.push({
            title: props.t('AntiCheatingRate'),
            dataIndex: 'antiCheatingRate',
            editable: true,
            tooltip: props.t('AntiCheatingRateTooltip'),
            valueType: 'digit'
        })
    }
    if (props.type === 2) {
        tableColumns.push({
            title: props.t('SubmitLimit'),
            dataIndex: 'submitLimit',
            editable: true,
            tooltip: props.t('SubmitLimitTooltip'),
            valueType: 'digit'
        })
    }

    tableColumns.push({
        title: props.t('operator'),
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
                    label={props.t('ProblemList')}
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
                <Form.Item name={"problemInfo"} label={props.t('ProblemList')}>
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
                                    title={props.t('CreateObjectiveProblem')}
                                    subForm={[{component: <ObjectiveForm type={"create"}/>, label: ""}]}
                                    formName={"ProblemObjectForm"}
                                    dataSubmitter={(value: any) => {
                                        let data = objectiveSubmit(value)
                                        if (data === null) return Promise.reject()
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
                                    title={props.t('CreateSubjectiveProblem')}
                                    subForm={[
                                        {component: <SubjectiveForm type={"create"}/>, label: props.t('BasicInformation')},
                                        {component: <SubjectiveConfigForm/>, label: props.t('JudgeInformation')}
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
                                        title={props.t('Edit')}
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
                                            if (data === null) return Promise.reject()
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
                                            {component: <SubjectiveForm type={"update"}/>, label: props.t('BasicInformation')},
                                            {component: <SubjectiveConfigForm/>, label: props.t('JudgeInformation')}
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
