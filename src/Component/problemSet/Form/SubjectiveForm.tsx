import {withTranslation} from "react-i18next";
import {Button, Form, InputNumber, Radio} from "antd";
import React, {useState} from "react";
import FormExtraInfo from "../../common/Form/FormExtraInfo";
import ItemEditor from "../../common/Form/Item/ItemEditor";
import CellEditTable from "../../common/Table/CellEditTable";

const SubjectiveForm = (props: any) => {

    const [typeData, setTypeData] = useState<any>()
    const tableColumns = [
        {
            title: '文件名称',
            dataIndex: 'name',
            editable: true,
            valueType: 'text'
        },
        {
            title: '文件大小上限（MB）',
            dataIndex: 'maxSizeMB',
            editable: true,
            valueType: 'digit'
        },
        {
            title: "文件类型",
            dataIndex: "fileType",
            tooltip: '绿色表示可以预览，红色表示暂不支持',
            editable: true,
            valueType: 'select',
            valueEnum: {
                pdf: {text: 'PDF 文档', status: 'Success'},
                docx: {text: 'Word 文档 (docx)', status: 'Error'},
                doc: {text: 'Word 文档 (doc)', status: 'Error'},
                zip: {text: '压缩文档 (zip)', status: 'Error'},
            }
        }
    ]
    return (
        <>
            <Form.Item name={"type"} hidden>
                <FormExtraInfo
                    v={typeData} setV={setTypeData} eqs={(a: any, b: any) => a === b}
                />
            </Form.Item>

            <Form.Item label={"类型"} rules={[{required: true}]}>
                <Radio.Group disabled={props.type === "update"} value={typeData} onChange={setTypeData}>
                    <Radio value={0}>文件作答</Radio>
                    <Radio value={1}>文本作答</Radio>
                </Radio.Group>
            </Form.Item>

            {typeData === 0 && (
                <>
                    <Form.Item name={["config", "fileList"]} label={"提交文件清单"}>
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
                                    >{"新增提交文件"}</Button>
                                ]
                            }}
                            rowButton={(row: any, value: any, onChange: any) => {
                                return []
                            }}
                        />
                    </Form.Item>
                </>
            )}

            {typeData === 1 && (
                <>
                    <Form.Item name={["config", "maxCount"]} label={"最大字数限制"}>
                        <InputNumber min={1} max={65535}/>
                    </Form.Item>
                </>
            )}

            <ItemEditor label={"题目描述"} name={"description"}/>
        </>
    )
}

export default withTranslation()(SubjectiveForm)
