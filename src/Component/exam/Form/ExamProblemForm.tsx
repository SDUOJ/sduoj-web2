import React, {Dispatch, useRef, useState} from "react";
import {Button, Popconfirm, Space, Radio, Skeleton} from "antd";
import {InfoCircleOutlined, MenuOutlined, PlusOutlined, RightOutlined,} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import ProgramAddForm from "../../problem/ProblemAddForm";
import {connect} from "react-redux";
import {
    examProblemGroupType,
    examProblemListType,
    genNumberList,
    ManageState
} from "../../../Type/IManage";
import {
    formSubmitType,
} from "../../../Redux/Action/manage";


// 可拖拽的排序手柄
const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
const SortableItem = SortableElement((props: any) => <tr {...props} />);
const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);


export type problemGroupUIMode = "easy" | "all"


const ExamProblemForm = (props: formSubmitType & any) => {
    // 可编辑表格的操作引用
    const actionRef = useRef<ActionType>();

    // === State ===
    const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);               // 考试题组展开
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);                       // 操作是否开启排序模式 【ProblemGroup】
    const [UIMode, setUIMode] = useState<problemGroupUIMode>("easy");                   // UI 模式           【ProblemGroup】
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(genNumberList(props.groupData))              // 编辑区域构造        【ProblemGroup】

    const setProblemGroupData = (data: examProblemGroupType[]) => {
        console.log("setProblemGroupData", data)
        for (const x of data) {
            const index = props.groupData.findIndex((value: examProblemGroupType) => value.id == x.id)
            if (index != -1)
                if (x.ProblemGroupType != props.groupData[index].ProblemGroupType) {
                    props.setListData(props.listData.filter((value: examProblemListType) => value.groupId != x.id))
                }
        }
        props.setGroupData(data)
    }
    const updateGroup = () => {
        setEditableRowKeys([])
        setEditableRowKeys(genNumberList(props.groupData))
    }

    // === 拖拽排序 ===
    // 排序结束后
    const onSortEnd = ({oldIndex, newIndex}: any) => {
        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            setProblemGroupData(arrayMoveImmutable(props.groupData, oldIndex, newIndex))
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
        )
    }
    const DraggableBodyRow = ({className, style, ...restProps}: any) => {
        // function findIndex base on Table rowKey props and should always be a right array index
        const index = props.groupData.findIndex((x: examProblemGroupType) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };

    // 题组表 - 列项
    const sortColumns: ProColumns<examProblemGroupType>[] = [
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
    ];
    const problemGroupInfoColumns: ProColumns<examProblemGroupType>[] = [
        {
            title: "ID",
            dataIndex: "id",
            valueType: "index",
            width: 50,
            editable: () => {
                return false
            }
        },
        {
            title: "题组名",
            dataIndex: "ProblemGroupName",
            valueType: "text",
            width: 170,
            editable: () => {
                return true
            }
        },
        {
            title: "题组类型",
            dataIndex: 'ProblemGroupType',
            valueType: "select",
            valueEnum: {
                single: {
                    text: "单选题"
                },
                multi: {
                    text: "多选题"
                },
                program: {
                    text: "编程题"
                }
            },
            width: 100,
            editable: () => {
                return true
            }
        },
        {
            title: "题组总分数",
            dataIndex: "ProblemGroupSumScore",
            width: 80,
            formItemProps: (form, {rowIndex}) => {
                return {}
            },
            editable: () => {
                return false
            }
        }
    ];
    const problemGroupExtColumns: ProColumns<examProblemGroupType>[] = [
        {
            title: "开始与结束时间",
            dataIndex: "ProblemGroupStartEndTime",
            valueType: 'dateTimeRange',
            width: 300,
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}],
                };
            },
            editable: () => {
                return true
            }
        },
        {
            title: "先决条件",
            dataIndex: "ProblemGroupPremise",
            valueType: "select",
            tooltip: {title: "在完成某一个题型后，才允许开始当前题型开始作答", icon: <InfoCircleOutlined/>},
            width: 170,
            valueEnum: (row) => {
                console.log("valueEnum", row)
                let obj: any = {}
                const index = props.groupData.findIndex((x: examProblemGroupType) => x.id === row.id);
                for (let i = 0; i < props.groupData.length; i++) {
                    // 只能选择 ID 小于当前 ID 的列
                    if (i < index) {
                        obj[props.groupData[i].id] =
                            {
                                text: props.groupData[i].ProblemGroupName == undefined ?
                                    "ID:" + (i + 1).toString() : props.groupData[i].ProblemGroupName
                            }
                    }

                }
                return obj
            },
            formItemProps: (form, {rowIndex}) => {
                return {}
            },
            editable: () => {
                return true
            }
        }
    ];
    const operatorColumns: ProColumns<examProblemGroupType>[] = [
        {
            title: props.t("operator"),
            valueType: 'option',
            width: 80,
            render: (text, record, _, action) => [],
        }
    ];

    // 动态控制列
    let problemGroupColumn: ProColumns<examProblemGroupType>[] = []
    if (sortSwitch) problemGroupColumn = problemGroupColumn.concat(sortColumns)                     // 排序列
    problemGroupColumn = problemGroupColumn.concat(problemGroupInfoColumns)                         // 主要信息列
    if (UIMode == "all") problemGroupColumn = problemGroupColumn.concat(problemGroupExtColumns)     // 附加信息列
    if (!sortSwitch) problemGroupColumn = problemGroupColumn.concat(operatorColumns)                // 操作列


    return (
        <>
            <Skeleton active loading={!props.isDataLoad}>
                <EditableProTable<examProblemGroupType>
                    headerTitle={"题组列表"}
                    value={props.groupData}
                    columns={problemGroupColumn}
                    rowKey={"id"}
                    recordCreatorProps={false}
                    actionRef={actionRef}
                    expandable={{
                        expandedRowRender: (record: examProblemGroupType, index: number, indent: number, expanded: boolean) => {
                            const proGroup = props.groupData.filter(((value: examProblemGroupType) => value.id == record.id))[0]
                            return (
                                <ProgramAddForm
                                    groupId={record.id}
                                    listData={props.listData}
                                    setListData={props.setListData}
                                    updateGroup={updateGroup}
                                    type={proGroup.ProblemGroupType}
                                    isDataLoad={props.isDataLoad}
                                    isStart={props.isStart}
                                />
                            )
                        },
                        rowExpandable: (record: examProblemGroupType) => {
                            const proGroup = props.groupData.filter(((value: examProblemGroupType) => value.id == record.id))[0]
                            return proGroup.ProblemGroupType != undefined && !sortSwitch
                        },
                        expandRowByClick: false,
                        expandedRowKeys: expandedRowKeys,
                        onExpand: (expanded: boolean, record: examProblemGroupType) => {
                            let NewExpandedRowKeys = expandedRowKeys
                            if (expanded) NewExpandedRowKeys.push(parseInt(record.id.toString()))
                            else NewExpandedRowKeys = NewExpandedRowKeys.filter((x: number) => x != parseInt(record.id.toString()))
                            setExpandedRowKeys(NewExpandedRowKeys)
                        }
                    }}
                    editable={{
                        type: 'multiple',
                        editableKeys: props.isStart || sortSwitch ? [] : editableKeys,
                        actionRender: (row: any, config: any, defDom: any) => {
                            return [
                                <Popconfirm
                                    title={props.t("deleteConfirm")}
                                    onConfirm={() => {
                                        setProblemGroupData(
                                            props.groupData.filter((value: examProblemGroupType) => value.id != row.id)
                                        )
                                    }}
                                    okText={props.t("yes")}
                                    cancelText={props.t("no")}
                                >
                                    <Button type={"link"} size={"small"}> {props.t("delete")} </Button>
                                </Popconfirm>
                            ]
                        },
                        onValuesChange: (record: examProblemGroupType, recordList: examProblemGroupType[]) => {
                            let NewDate = []
                            for (let i = 0; i < recordList.length; i++) {
                                if (recordList[i].id != undefined)
                                    NewDate.push(recordList[i])
                            }
                            setProblemGroupData(NewDate)
                        },
                        onChange: (editableKeys: React.Key[], editableRows: any) => {
                            setEditableRowKeys(editableKeys);
                        },
                    }}
                    components={sortSwitch ? {
                        body: {
                            wrapper: DraggableContainer,
                            row: DraggableBodyRow
                        }
                    } : undefined}
                />
                <Space style={{marginBottom: "20px"}} size={30}>
                    <Button
                        type="default"
                        onClick={() => {
                            actionRef.current?.addEditRecord?.({id: Date.now()}, {newRecordType: "dataSource"});
                        }}
                        icon={<PlusOutlined/>}
                        disabled={props.isStart}
                    >
                        新建题组
                    </Button>

                    <Radio.Group
                        defaultValue="edit"
                        buttonStyle="solid"
                        onChange={(evt) => {
                            switch (evt.target.value) {
                                case "sort":
                                    setExpandedRowKeys([])
                                    setSortSwitch(true)
                                    return
                                case "edit":
                                    setSortSwitch(false)
                                    return
                            }
                        }}
                        disabled={props.isStart}
                    >
                        <Radio.Button value="edit">编辑</Radio.Button>
                        <Radio.Button value="sort">排序</Radio.Button>
                    </Radio.Group>
                    <Radio.Group
                        defaultValue="easy"
                        buttonStyle="solid"
                        onChange={(evt) => {
                            switch (evt.target.value) {
                                case "easy":
                                    setUIMode("easy")
                                    return
                                case "all":
                                    setUIMode("all")
                                    return
                            }
                        }}
                        disabled={props.isStart}
                    >
                        <Radio.Button value="easy">简单模式</Radio.Button>
                        <Radio.Button value="all" disabled>完全模式（暂不支持）</Radio.Button>
                    </Radio.Group>
                </Space>
            </Skeleton>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: ManageState = state.ManageReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamProblemForm))
