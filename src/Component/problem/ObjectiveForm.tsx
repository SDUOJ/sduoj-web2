import React, {useRef, useState} from "react";
import {Button, Space} from "antd";
import type {ProFormInstance} from '@ant-design/pro-form';
import ProForm from '@ant-design/pro-form';
import {MenuOutlined, PlusOutlined,} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";


// 可拖拽的排序手柄
const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
const SortableItem = SortableElement((props: any) => <tr {...props} />);
const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);

type DataSourceType = {
    id: React.Key;
    content?: string
};

const defaultData: DataSourceType[] = [
    {id: 0, content: "A"},
    {id: 1, content: "B"},
    {id: 2, content: "C"},
    {id: 3, content: "D"},
]

const ObjectiveForm = (props: any) => {
    const actionRef = useRef<ActionType>();
    const formRef = useRef<ProFormInstance<any>>();
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);
    // const [dataSource, setDataSource] = useState<DataSourceType[]>(() => defaultData);
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(() =>
        defaultData.map((item) => item.id),
    );


    // 排序结束后
    const onSortEnd = ({oldIndex, newIndex}: any) => {
        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            let dataSource = formRef.current?.getFieldsValue()
            dataSource.table = arrayMoveImmutable(dataSource.table, oldIndex, newIndex)
            formRef.current?.setFieldsValue(dataSource)
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
                    rules: [{required: true, message: '此项为必填项'}]
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
            width: 200,
            render: (text, record, _, action) => [],
        }
    ]

    let columns: ProColumns<DataSourceType>[] = []
    if (sortSwitch) columns = columns.concat(sortColumns)
    columns = columns.concat(choiceColumns)
    if (!sortSwitch && formRef.current?.getFieldsValue().table.length > 2) columns = columns.concat(operatorColumns)

    return (
        <>
            <ProForm<{ table: DataSourceType[] }>
                formRef={formRef}
                initialValues={{
                    table: defaultData,
                }}
                submitter={{
                    // 配置按钮文本
                    searchConfig: {
                        resetText: '重置',
                        submitText: '提交',
                    },
                    // 配置按钮的属性
                    resetButtonProps: {style: {display: 'none'}},
                    submitButtonProps: {style: {display: 'none'}},
                }}
            >

                <EditableProTable<DataSourceType>
                    name="table"
                    columns={columns}
                    rowKey={"id"}
                    // onChange={setDataSource}
                    recordCreatorProps={false}
                    actionRef={actionRef}

                    editable={{
                        type: 'multiple',
                        editableKeys: sortSwitch ? [] : editableKeys,
                        actionRender: (row: any, config: any, defDom: any) => {
                            return [defDom.delete]
                        },
                        onValuesChange: (record, recordList) => {
                            let dataSource = formRef.current?.getFieldsValue()
                            dataSource.table = recordList
                            formRef.current?.setFieldsValue(dataSource)
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
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            actionRef.current?.addEditRecord?.({
                                id: Date.now(),
                                content: ""
                            }, {newRecordType: "dataSource", recordKey: Date.now()});
                        }}
                        icon={<PlusOutlined/>}
                        disabled={formRef.current?.getFieldsValue().table.length >= 26}
                    >
                        新增选项
                    </Button>
                    <Button
                        type="default"
                        key="operator"
                        onClick={() => {
                            setSortSwitch(!sortSwitch)
                        }}
                    >
                        {sortSwitch ? "编辑" : "排序"}
                    </Button>
                </Space>
            </ProForm>
            <Space>
                <Button
                    type="default"
                    key="rest"
                    onClick={() => formRef.current?.resetFields()}
                >
                    重置
                </Button>
                <Button
                    type="primary"
                    key="submit"
                    onClick={() => {
                        console.log(formRef.current?.getFieldsValue())
                        formRef.current?.submit?.()
                    }}
                >
                    提交
                </Button>
            </Space>
        </>
    );

}

export default withTranslation()(ObjectiveForm)