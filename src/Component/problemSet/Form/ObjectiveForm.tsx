import React, {useEffect, useState} from "react";
import {Button, Form, Radio} from "antd";
import {ProFormCheckbox, ProFormTextArea} from '@ant-design/pro-form';
import {PlusOutlined,} from "@ant-design/icons"
import {ProColumns} from "@ant-design/pro-table";
import {withTranslation} from "react-i18next";
import {genAnswerList} from "Type/IManage";
import CellEditTable from "../../common/Table/CellEditTable";
import equ from "../../../Utils/equ";
import FormExtraInfo from "../../common/Form/FormExtraInfo";


const initData = {
    choice: [
        {id: 0, content: ""},
        {id: 1, content: ""},
        {id: 2, content: ""},
        {id: 3, content: ""}
    ],
    content: "",
    answer: []
}

const ObjectiveForm = (props: any) => {

    const [answerList, setAnswerList] = useState<string[]>([]);
    const [choiceData, setChoiceData] = useState<any>(props.type === "create" ? initData.choice : undefined);


    useEffect(() => {
        if (choiceData !== undefined)
            setAnswerList(genAnswerList(choiceData))
    }, [choiceData])

    const choiceColumns: ProColumns[] = [
        {
            title: props.t("choice"),
            dataIndex: 'id',
            width: 60,
            render: (text, record, index) => {
                return <span>{String.fromCharCode('A'.charCodeAt(0) + index)}</span>
            },
            editable: () => {
                return false
            }
        },
        {
            title: props.t("content"),
            dataIndex: 'content',
            valueType: 'text',
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}, {type: "string", min: 1, max: 250}]
                };
            },
            editable: () => {
                return true
            }
        }
    ];
    const operatorColumns: ProColumns[] = [
        {
            title: props.t("operator"),
            valueType: 'option',
            width: 80,
            render: (text, record, _, action) => [],
        }
    ]

    // 动态控制列
    let columns: ProColumns[] = []
    columns = columns.concat(choiceColumns)
    if (choiceData && choiceData.length > 2)
        columns = columns.concat(operatorColumns)

    return (
        <>
            <Form.Item label={"类型"} name={"type"} rules={[{required: true}]}>
                <Radio.Group disabled={props.type === "update"}>
                    <Radio value={0}>单选</Radio>
                    <Radio value={1}>多选</Radio>
                    <Radio value={2}>不定项</Radio>
                </Radio.Group>
            </Form.Item>
            <ProFormTextArea width="xl" name={["content", "description"]} label={props.t("ProblemContent")}
                             rules={[{required: true}, {type: "string", min: 5, max: 1000}]}/>
            <Form.Item name={["content", "choice"]} required hidden>
                <FormExtraInfo
                    v={choiceData} setV={setChoiceData} eqs={equ}
                />
            </Form.Item>
            <Form.Item label={"选项"}>
                <CellEditTable
                    columns={columns}
                    rowKey={"id"}
                    value={choiceData}
                    onChange={setChoiceData}
                    toolBar={(actionRef: any) => {
                        return [<Button
                            type={"dashed"}
                            block
                            onClick={() => {
                                actionRef.current?.addEditRecord?.({
                                    id: Date.now(),
                                    content: ""
                                }, {newRecordType: "dataSource"});
                            }}
                            icon={<PlusOutlined/>}
                            disabled={choiceData && choiceData.length >= 26}
                        >
                            {props.t("NewOption")}
                        </Button>]
                    }}
                    rowButton={() => []}
                />
            </Form.Item>
            <ProFormCheckbox.Group
                name="answer"
                layout="vertical"
                label={props.t("answer")}
                options={answerList}
                rules={[{required: true, message: props.t("PleaseChooseTheAnswer")}]}
            />
        </>
    );
}

export default withTranslation()(ObjectiveForm)
