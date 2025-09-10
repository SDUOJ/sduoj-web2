import {withTranslation} from "react-i18next";
import {Button, Form, InputNumber, Radio, Select} from "antd";
import React, {useState} from "react";
import FormExtraInfo from "../../common/Form/FormExtraInfo";
import ItemEditor from "../../common/Form/Item/ItemEditor";
import CellEditTable from "../../common/Table/CellEditTable";
import {PlusOutlined} from "@ant-design/icons";

const SubjectiveForm = (props: any) => {

    const [typeData, setTypeData] = useState<any>()
    const tableColumns = [
        {
            title: props.t('fileName'),
            dataIndex: 'name',
            editable: true,
            valueType: 'text'
        },
        {
            title: props.t('fileSizeLimitMB'),
            dataIndex: 'maxSizeMB',
            editable: true,
            valueType: 'digit'
        },
        {
            title: props.t("fileType"),
            dataIndex: "fileType",
            tooltip: props.t('fileTypeTooltip'),
            editable: true,
            valueType: 'select',
            valueEnum: {
                pdf: {text: props.t('pdfDocument'), status: 'Success'},
                docx: {text: props.t('wordDocx'), status: 'Error'},
                doc: {text: props.t('wordDoc'), status: 'Error'},
                zip: {text: props.t('zipArchive'), status: 'Error'},
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

        <Form.Item label={props.t("Type")} rules={[{required: true}]}> 
                <Radio.Group disabled={props.type === "update"} value={typeData} onChange={setTypeData}>
            <Radio value={0}>{props.t('fileAnswer')}</Radio>
            <Radio value={1}>{props.t('textAnswer')}</Radio>
            <Radio value={2}>{props.t('acceptanceAnswer')}</Radio>
                </Radio.Group>
            </Form.Item>

            {typeData === 0 && (
                <>
                    <Form.Item name={["config", "fileList"]} label={props.t("submitFileList")}>
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
                                    >{props.t('addSubmitFile')}</Button>
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
                    <Form.Item name={["config", "maxCount"]} label={props.t("maxWordCountLimit")}>
                        <InputNumber min={1} max={65535}/>
                    </Form.Item>
                </>
            )}

            {typeData === 2 && (
                <>
                    <Form.Item name={["config", "review_queue"]} label={props.t("reviewQueue")} tooltip={props.t("reviewQueueTooltip")}> 
                        <Select
                            mode="tags"
                            placeholder={props.t("reviewQueuePlaceholder")}
                        />
                    </Form.Item>
                </>
            )}

            <ItemEditor label={props.t("ProblemDescription")} name={"description"}/>
        </>
    )
}

export default withTranslation()(SubjectiveForm)
