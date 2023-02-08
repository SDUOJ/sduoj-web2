import {Button, Form} from "antd";
import {withTranslation} from "react-i18next";
import ModalFormUseForm from "../../common/Form/ModalFormUseForm";
import ObjectiveForm from "./ObjectiveForm";
import mApi from "../../../Utils/API/m-api";
import objectiveSubmit from "../dataConvert/objectiveSubmit";
import objectiveGet from "../dataConvert/objectiveGet";
import CellEditTable from "../../common/Table/CellEditTable";
import React from "react";

const SubjectiveConfigForm = (props: any) => {
    const tableColumns = [
        {
            title: '得分项名称',
            dataIndex: 'name',
            editable: true,
            valueType: 'text'
        },
        {
            title: '分值',
            dataIndex: 'score',
            editable: true,
            valueType: 'digit'
        },
        {
            title: "答案",
            dataIndex: "answer",
            editable: true,
            valueType: 'textarea'
        }
    ]
    return (
        <>
            <Form.Item name={["config", "judgeConfig"]} label={"评测配置"}>
                <CellEditTable
                    columns={tableColumns}
                    rowKey={"id"}
                    toolBar={(actionRef: any) => {
                        return [
                            <Button
                                type={"default"}
                                onClick={() => {
                                    actionRef.current?.addEditRecord?.({
                                        id: Date.now()
                                    }, {newRecordType: "dataSource"});
                                }}
                            >{"新增得分项"}</Button>
                        ]
                    }}
                    rowButton={(row: any, value: any, onChange: any) => {
                        return []
                    }}
                />
            </Form.Item>
        </>
    )
}

export default withTranslation()(SubjectiveConfigForm)
