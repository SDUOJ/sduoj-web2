import React, {useRef, useState} from "react";
import {Button, Form, message, Popconfirm, Radio, Skeleton, Space} from "antd";
import type {ProFormInstance} from '@ant-design/pro-form';
import {ModalForm, ProFormCheckbox, ProFormText, ProFormTextArea} from '@ant-design/pro-form';
import {MenuOutlined, PlusOutlined,} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import {genAnswerList, genEditableList} from "../../Type/IManage";
import mApi from "Utils/API/m-api"
import SelectGroup from "../group/SelectGroup";
import {groupSelection} from "../../Type/Igroup";

// 可拖拽的排序手柄
const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
const SortableItem = SortableElement((props: any) => <tr {...props} />);
const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);

type DataSourceType = {
    id: React.Key
    content?: string
};


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
    // 可编辑表格的操作引用
    const actionRef = useRef<ActionType>();
    // 页面表单的操作引用
    const formRef = useRef<ProFormInstance<any>>();

    // === State ===
    // 操作是否开启排序模式
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);
    // 答案多选项构造
    const [answerList, setAnswerList] = useState<string[]>(genAnswerList(initData.choice));
    // 编辑区域构造
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(genEditableList(initData.choice));
    const [modalVis, setModalVis] = useState<boolean>(false);
    const [isDataLoad, setIsDataLoad] = useState<boolean>(false);
    const [groupInfo, setGroupInfo] = useState<groupSelection[]>()

    // === 拖拽排序 ===
    // 排序结束后
    const onSortEnd = ({oldIndex, newIndex}: any) => {
        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            // console.log("onSortEnd", oldIndex, newIndex)
            setFormValue(arrayMoveImmutable(getForm().choice, oldIndex, newIndex))
        }
    };
    const DraggableContainer = (props: any) => {
        return (
            <XSortableContainer
                useDragHandle
                disableAutoscroll
                helperClass="row-dragging"
                onSortEnd={onSortEnd}
                {...props}
            />
        );
    }
    const DraggableBodyRow = ({className, style, ...restProps}: any) => {
        let dataSource = formRef.current?.getFieldsValue().choice
        const index = dataSource.findIndex((x: DataSourceType) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };

    // 设置当前表单值
    const setFormValue = (choice?: DataSourceType[]) => {
        let data = formRef.current?.getFieldsValue()
        const Data = formRef.current?.getFieldsValue()
        if (data !== undefined) {
            if (choice !== undefined) data.choice = choice
            if (Data.choice !== undefined && Data.choice.length !== data.choice.length) {
                setAnswerList(genAnswerList(data.choice))
                setEditableRowKeys(genEditableList(data.choice))
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
    if (!sortSwitch && (getForm()?.choice?.length === undefined || getForm()?.choice?.length > 2)) columns = columns.concat(operatorColumns)

    return (
        <>
            <ModalForm
                visible={modalVis}
                onVisibleChange={setModalVis}
                title={props.type === "create" ? "新建" : props.title}
                formRef={formRef}
                initialValues={initData}
                trigger={
                    <Button type={props.type === "create" ? "primary" : "link"}
                            onClick={() => {
                                setModalVis(true)
                                if (props.type === "update") {
                                    mApi.getChoiceInfo(props.problemCode).then((resData: any) => {
                                        if (resData !== null) {
                                            // console.log(resData)
                                            const choice = resData.description.choice
                                            setAnswerList(genAnswerList(Object.keys(choice)))
                                            setEditableRowKeys(genEditableList(Object.keys(choice)))
                                            setGroupInfo(resData.managerGroupDTOList)
                                            let Choice = []
                                            for(let i = 0; i < Object.keys(choice).length; i ++){
                                                Choice.push({
                                                    id: i,
                                                    content: choice[String.fromCharCode('A'.charCodeAt(0) + i)]
                                                })
                                            }
                                            let MG = []
                                            for(const x of resData.managerGroupDTOList){
                                                MG.push(x.groupId)
                                            }

                                            formRef.current?.setFieldsValue({
                                                isMulti: resData.isMulti.toString(),
                                                problemTitle: resData.problemTitle,
                                                content: resData.description.content,
                                                choice: Choice,
                                                answer: resData.answer,
                                                managerGroups: MG
                                            })
                                            setIsDataLoad(true)
                                        }
                                    })
                                } else {
                                    setIsDataLoad(true)
                                }
                            }}>
                        {
                            [''].map(() => {
                                if (props.type === "create") return <PlusOutlined/>
                            })
                        }
                        {props.type === "create" ? "新建" : "修改"}
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
                                type="primary"
                                onClick={() => {
                                    formRef.current?.validateFields().then(value => {
                                        for (let i = 0; i < value.choice.length; i++) {
                                            if (value.choice[i].content.length === 0) {
                                                message.error("选项不能为空")
                                                return
                                            }
                                        }
                                        if (value.isMulti === "1" && value.answer.length === 1) {
                                            message.error("多选题应该有两个及以上答案")
                                            return;
                                        }
                                        if (value.isMulti === "0" && value.answer.length !== 1) {
                                            message.error("单选题只能有一个答案")
                                            return;
                                        }
                                        let choice: any = {}
                                        for (let i = 0; i < value.choice.length; i++) {
                                            choice[String.fromCharCode('A'.charCodeAt(0) + i)] = value.choice[i].content
                                        }
                                        let data: any = {
                                            isPublic: 1,
                                            problemTitle: value.problemTitle,
                                            isMulti: value.isMulti,
                                            description: {
                                                content: value.content,
                                                choice: choice
                                            },
                                            answer: value.answer,
                                            managerGroups: value.managerGroups === undefined ? [] : value.managerGroups
                                        }
                                        if (props.type === "create") {
                                            mApi.createChoiceProblem(data).then((resData) => {
                                                message.success("成功")
                                                setModalVis(false)
                                                setTimeout(()=>{
                                                    window.location.reload()
                                                }, 1000)
                                            })
                                        } else if (props.type === "update") {
                                            data['problemCode'] = props.problemCode
                                            mApi.updateChoiceProblem(data).then((resData) => {
                                                message.success("成功")
                                                setModalVis(false)
                                                props.update()
                                            })
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
                <Skeleton active loading={!isDataLoad}>
                    <Form.Item label={"类型"} name={"isMulti"} rules={[{required: true}]}>
                        <Radio.Group buttonStyle="solid" disabled={props.type === "update"}>
                            <Radio.Button value="0">单选题</Radio.Button>
                            <Radio.Button value="1">多选题</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <ProFormText width="xl" name="problemTitle" label={"标题"} rules={[{required: true}]}/>

                    <ProFormTextArea width="xl" name="content" label={props.t("ProblemContent")}
                                     rules={[{required: true}, {type: "string", min: 5, max: 1000}]}/>
                    <EditableProTable<DataSourceType>
                        name="choice"
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
                                            let choice = formRef.current?.getFieldValue("choice")
                                            choice = choice.filter((value: DataSourceType) => value.id !== row.id)
                                            setFormValue(choice)
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
                            disabled={getForm()?.choice !== undefined && getForm()?.choice.length >= 26}
                        >
                            {props.t("NewOption")}
                        </Button>
                        <Radio.Group defaultValue="edit" buttonStyle="solid" onChange={(value) => {
                            setSortSwitch(!sortSwitch)
                        }}>
                            <Radio.Button value="edit">编辑</Radio.Button>
                            <Radio.Button value="sort">排序</Radio.Button>
                        </Radio.Group>
                    </Space>

                    <ProFormCheckbox.Group
                        name="answer"
                        layout="vertical"
                        label={props.t("answer")}
                        options={answerList}
                        rules={[{required: true, message: props.t("PleaseChooseTheAnswer")}]}
                    />

                    <SelectGroup mode={"multiple"} label={"管理组"} name={"managerGroups"}
                                 groupInfo={groupInfo}/>
                </Skeleton>
            </ModalForm>
        </>
    );
}

export default withTranslation()(ObjectiveForm)