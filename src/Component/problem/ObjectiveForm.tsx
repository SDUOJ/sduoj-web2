import React, {useRef, useState} from "react";
import {Button, message, Popconfirm, Space, Switch} from "antd";
import type {ProFormInstance} from '@ant-design/pro-form';
import ProForm, {ProFormTextArea, ModalForm, ProFormCheckbox} from '@ant-design/pro-form';
import {CheckOutlined, CloseOutlined, MenuOutlined, PlusOutlined,} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";


// 可拖拽的排序手柄
const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
const SortableItem = SortableElement((props: any) => <tr {...props} />);
const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);

type DataSourceType = {
    id: React.Key
    content?: string
};

// 新建 与 修改
export type ObjectiveFormMode = "new" | "modify"

// TODO 1. 在 Reset 的时候，答案的选项应该按照初始化，变为 4 个
// TODO 2. 排序后，答案会清空，不能按照原来的答案记忆
// TODO 3. 客观题文本显示暂时不支持数学公式


// 新建是默认的选项
const defaultData: DataSourceType[] = [
    {id: 0, content: "A"},
    {id: 1, content: "B"},
    {id: 2, content: "C"},
    {id: 3, content: "D"},
]

const defaultAnswer: string[] = []

const ObjectiveForm = (props: any) => {
    // 可编辑表格的操作引用
    const actionRef = useRef<ActionType>();
    // 页面表单的操作引用
    const formRef = useRef<ProFormInstance<any>>();

    // === State ===
    // 操作是否开启排序模式
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);
    // 答案多选项构造
    const [answerList, setAnswerList] = useState<string[]>(["A", "B", "C", "D"]);
    // 编辑区域构造
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(() =>
        defaultData.map((item) => item.id),
    );

    // === 拖拽排序 ===
    // 排序结束后
    const onSortEnd = ({oldIndex, newIndex}: any) => {
        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            console.log("onSortEnd", oldIndex, newIndex)
            setFormValue(arrayMoveImmutable(getForm().table, oldIndex, newIndex), undefined, [])
        }
    };
    const DraggableContainer = (props: any) => (
        <XSortableContainer
            useDragHandle
            disableAutoscroll
            helperClass="row-dragging"
            onSortEnd={onSortEnd}
            {...props}
        />
    );
    const DraggableBodyRow = ({className, style, ...restProps}: any) => {
        // function findIndex base on Table rowKey props and should always be a right array index
        let dataSource = formRef.current?.getFieldsValue().table
        const index = dataSource.findIndex((x: DataSourceType) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };

    // 设置当前表单值
    const setFormValue = (table?: DataSourceType[], content?: string, answer?: string[]) => {
        let data = formRef.current?.getFieldsValue()
        const Data = formRef.current?.getFieldsValue()
        console.log("setFormValue", data)
        console.log(table, content, answer)
        if (data != undefined) {
            if (table != undefined) data.table = table
            if (content != undefined) data.content = content
            if (answer != undefined) data.answer = answer

            if (Data.table.length != data.table.length) {
                let list: string[] = []
                let edit: number[] = []
                for (let i = 0; i < data.table.length; i++) {
                    list.push(String.fromCharCode('A'.charCodeAt(0) + i))
                    edit.push(i)
                }

                setAnswerList(list)
                setEditableRowKeys(edit)
                data.answer = []
            }

            formRef.current?.setFieldsValue(data)
        }
    }
    // 获取当前 form 值
    const getForm = () => {
        return formRef.current?.getFieldsValue()
    }

    const sortColumns: ProColumns<DataSourceType>[] = [
        {
            title: props.t("sort"),
            dataIndex: 'sort',
            width: 50,
            className: "drag-visable",
            render: () => <DragHandle/>,
            editable: () => {
                return false
            }
        }
    ]
    const choiceColumns: ProColumns<DataSourceType>[] = [
        {
            title: props.t("choice"),
            dataIndex: 'choice',
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
    const operatorColumns: ProColumns<DataSourceType>[] = [
        {
            title: props.t("operator"),
            valueType: 'option',
            width: 80,
            render: (text, record, _, action) => [],
        }
    ]

    // 动态控制列
    let columns: ProColumns<DataSourceType>[] = []
    if (sortSwitch) columns = columns.concat(sortColumns)
    columns = columns.concat(choiceColumns)
    if (!sortSwitch && (getForm()?.table?.length == undefined || getForm()?.table?.length > 2)) columns = columns.concat(operatorColumns)

    return (
        <>
            <ModalForm<{ table: DataSourceType[] }>
                title={"新建题目"}
                formRef={formRef}
                initialValues={{
                    table: defaultData,
                    content: "",
                    answer: defaultAnswer
                }}
                trigger={
                    <Button type={props.mode == "add" ? "primary" : "link"}>
                        <PlusOutlined/>
                        {props.mode == "add" ? "新建题目" : "修改"}
                    </Button>
                }
                submitter={{
                    // 配置按钮文本
                    searchConfig: {
                        resetText: '重置',
                        submitText: '提交',
                    },
                    // 配置按钮的属性
                    resetButtonProps: {style: {display: 'none'}},
                    submitButtonProps: {style: {display: 'none'}},
                    render: (prop, defaultDoms) => {
                        return [
                            <Button
                                type="default"
                                key="rest"
                                onClick={() => formRef.current?.resetFields()}
                            >
                                {props.t("Reset")}
                            </Button>,
                            <Button
                                type="primary"
                                key="submit"
                                onClick={() => {
                                    console.log(formRef.current?.getFieldsValue())
                                    formRef.current?.validateFields().then(value => {
                                        for (let i = 0; i < value.table.length; i++) {
                                            if (value.table[i].content.length == 0) {
                                                message.error("选项不能为空")
                                                return
                                            }
                                        }


                                    }).catch(error => {
                                        console.log(error)
                                    })
                                }}
                            >
                                {props.t("Submit")}
                            </Button>
                        ]
                    }
                }}
            >
                <ProFormTextArea width="lg" name="content" label={props.t("ProblemContent")}
                                 rules={[{required: true}, {type: "string", min: 5, max: 1000}]}/>
                <EditableProTable<DataSourceType>
                    name="table"
                    columns={columns}
                    rowKey={"id"}
                    recordCreatorProps={false}
                    actionRef={actionRef}
                    editable={{
                        type: 'multiple',
                        editableKeys: sortSwitch ? [] : editableKeys,
                        actionRender: (row: any, config: any, defDom: any) => {
                            return [
                                <Popconfirm
                                    title={props.t("deleteConfirm")}
                                    onConfirm={() => {
                                        let table = formRef.current?.getFieldValue("table")
                                        table = table.filter((value: DataSourceType) => value.id != row.id)
                                        setFormValue(table)
                                    }}
                                    okText={props.t("yes")}
                                    cancelText={props.t("no")}
                                >
                                    <Button type={"link"} size={"small"}> {props.t("delete")} </Button>
                                </Popconfirm>
                            ]
                        },
                        onValuesChange: (record, recordList) => {
                            setFormValue(recordList)
                        },
                        onChange: setEditableRowKeys,
                    }}
                    components={sortSwitch ?
                        {
                            body: {
                                wrapper: DraggableContainer,
                                row: DraggableBodyRow,
                            },
                        } : undefined
                    }
                />
                <Space style={{marginBottom: "20px"}}>
                    <Button
                        type="default"
                        onClick={() => {
                            actionRef.current?.addEditRecord?.({
                                id: Date.now(),
                                content: ""
                            }, {newRecordType: "dataSource", recordKey: Date.now()});
                        }}
                        icon={<PlusOutlined/>}
                        disabled={getForm()?.table.length >= 26}
                    >
                        {props.t("NewOption")}
                    </Button>
                    <Button
                        type="default"
                        key="operator"
                        onClick={() => {
                            setSortSwitch(!sortSwitch)
                        }}
                    >
                        {sortSwitch ? props.t("Edit") : props.t("sort")}
                    </Button>
                </Space>

                <ProFormCheckbox.Group
                    name="answer"
                    layout="vertical"
                    label={props.t("answer")}
                    options={answerList}
                    rules={[{required: true, message: props.t("PleaseChooseTheAnswer")}]}
                />


            </ModalForm>
        </>
    );
}

export default withTranslation()(ObjectiveForm)