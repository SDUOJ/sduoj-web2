import {Button, Form} from "antd";
import {withTranslation} from "react-i18next";
import CellEditTable from "../../common/Table/CellEditTable";
import React from "react";
import {PlusOutlined} from "@ant-design/icons";

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
                                type={"dashed"}
                                block
                                icon={<PlusOutlined/>}
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
