import React, {RefObject, useEffect, useRef, useState} from "react";
import {Button, Form, FormInstance, Popconfirm, Skeleton, Space} from "antd";
import {MenuOutlined, PlusOutlined, SortAscendingOutlined, EditOutlined} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import {examProblemDescription, examProblemInfo, examProblemType, genNumberList} from "../../Type/IManage";
import mApi from "Utils/API/m-api"
import Paragraph from "antd/lib/typography/Paragraph";


const ProblemAddForm = (props: any) => {
    // 可编辑表格的操作引用
    const actionRef = useRef<ActionType>();
    const [form] = Form.useForm();
    const getListData = (type?: string) => {
        for (const x of props.listData) {
            if (x.groupId == props.groupId) {
                if (type == undefined) return x.proList
                if (type == "problemInfo") return x.problemInfo
                if (type == "checkedProblemCode") return x.checkedProblemCode
            }
        }
        props.listData.push({
            groupId: props.groupId,
            proList: [],
            problemInfo: [],
            checkedProblemCode: []
        })
        props.setListData(props.listData)
        return []
    }
    const strMatch = (value: string) => {
        if (props.type == "single" || props.type == "multi")
            return value.match(/SDUOJ-C-[0-9]{4}/)
        if (props.type == "program")
            return value.match(/SDUOJ-[0-9]{4}/)
    }

    // === State ===
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);           // 操作是否开启排序模式
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(genNumberList(getListData()));   // 编辑区域构造
    const [proListData, setProListData] = useState<examProblemType[]>(getListData())
    const [problemInfo, setProblemInfo] = useState<examProblemInfo[]>(getListData("problemInfo"))       // 记录题面选项信息
    const [checkedProblemCode, setCheckedProblemCode] = useState<string[]>(getListData("checkedProblemCode"))

    const [descriptionLoading, setDescriptionLoading] = useState<string[]>([])


    const setListDataAll = (listData: examProblemType[]) => {
        for (let x of props.listData) {
            if (x.groupId == props.groupId) x.proList = listData
        }
        props.setListData(props.listData)
        setProListData(listData)
        props.updateGroup()
        // 刷新当前界面的编辑值
        setEditableRowKeys([])
        setEditableRowKeys(genNumberList(getListData()))
    }
    const setProblemInfoAll = (data: examProblemInfo[]) => {
        for (let x of props.listData) {
            if (x.groupId == props.groupId) x.problemInfo = data
        }
        props.setListData(props.listData)
        setProblemInfo(data)
    }
    const setCheckedProblemCodeAll = (data: string[]) => {
        for (let x of props.listData) {
            if (x.groupId == props.groupId) x.checkedProblemCode = data
        }
        props.setListData(props.listData)
        setCheckedProblemCode(data)
    }
    const getValueEnum = (problemCode?: string) => {
        if (problemCode == undefined) return {}
        for (const x of problemInfo) {
            if (x.problemCode == problemCode) return x.problemDescription
        }
        if (strMatch(problemCode) != null && descriptionLoading.indexOf(problemCode) != -1) {
            descriptionLoading.push(problemCode)
            setDescriptionLoading(descriptionLoading)
            return mApi.getProblemDescriptionList({problemCode: problemCode}).then(
                (resData) => {
                    if (resData != null) {
                        let res: any = {}
                        const data: examProblemDescription[] = resData as unknown as examProblemDescription[]
                        for (const x of data) res[x.id] = ({text: x.title})
                        problemInfo.push({
                            problemCode: problemCode,
                            problemDescription: res
                        })
                        setProblemInfoAll(problemInfo)
                        setEditableRowKeys([])
                        setEditableRowKeys(genNumberList(getListData()))
                    }
                })
        }
        return {}
    }

    // === 拖拽排序 ===
    // 可拖拽的排序手柄
    const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
    const SortableItem = SortableElement((props: any) => <tr {...props} />);
    const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);
    // 排序结束后
    const onSortEnd = ({oldIndex, newIndex}: any) => {
        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            // console.log("onSortEnd", oldIndex, newIndex)
            setListDataAll(arrayMoveImmutable(proListData, oldIndex, newIndex))
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
        const index = proListData.findIndex((x: examProblemType) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };

    useEffect(() => {
        setTimeout(() => {
            form.validateFields()
        }, 100)
    }, [props.isDataLoad])

    const sortColumns: ProColumns<examProblemType>[] = [
        {
            title:
                <Button type="text" key="operator" onClick={() => {
                    setSortSwitch(!sortSwitch)
                }} icon={sortSwitch ? <EditOutlined/> : <SortAscendingOutlined/>}
                />
            ,
            dataIndex: 'sort',
            width: 50,
            className: "drag-visable",
            render: () => sortSwitch ? <DragHandle/> : undefined,
            editable: () => {
                return false
            }
        }
    ]
    const baseAColumns: ProColumns<examProblemType>[] = [
        {
            title: <Button type="text" onClick={() => {
                const code = proListData.length == 0 ? undefined : proListData[proListData.length - 1].ProblemCode
                const score = proListData.length == 0 ? undefined : proListData[proListData.length - 1].ProblemScore
                const submitNumber = proListData.length == 0 ? undefined : proListData[proListData.length - 1].ProblemSubmitNumber
                const number = code == undefined ? 0 : parseInt(code.substr(-4))
                const NewCode = code == undefined ? undefined : code.substr(0, code.length - 4) + (number + 1).toString()
                actionRef.current?.addEditRecord?.({
                    id: Date.now(),
                    ProblemCode: NewCode,
                    ProblemScore: score,
                    ProblemSubmitNumber: submitNumber,
                }, {newRecordType: "dataSource", recordKey: Date.now()});
                if (NewCode != undefined)
                    setTimeout(() => {
                        form.validateFields()
                    }, 100)
            }} icon={<PlusOutlined/>} disabled={sortSwitch}
            />,
            dataIndex: 'id',
            valueType: "index",
            width: 50,
            render: (text, record, index) => {
                return <span>{index + 1}</span>
            },
            editable: () => {
                return false
            }
        },
        {
            title: "题目编号",
            dataIndex: 'ProblemCode',
            width: 200,
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                if (strMatch(value) != null) {
                                    if (checkedProblemCode.indexOf(value) == -1) {
                                        checkedProblemCode.push(value)
                                        setCheckedProblemCodeAll(checkedProblemCode)
                                        if (props.type == "program") {
                                            return mApi.getProblem({problemCode: value}).then((resData: any) => {
                                                if (resData == null) return Promise.reject()
                                                else {
                                                    proListData[rowIndex].ProblemAlias = resData.problemTitle;
                                                    proListData[rowIndex].ProblemDescription = resData.defaultDescriptionId;
                                                    setListDataAll(proListData);
                                                    return Promise.resolve()
                                                }
                                            })
                                        } else {
                                            return mApi.getChoiceProblem({problemCode: value}).then((resData: any) => {
                                                if (resData == null) return Promise.reject()
                                                else {
                                                    if (resData.isMulti == 1 && props.type == "single") {
                                                        return Promise.reject("单选题组不能录入多选题")
                                                    }
                                                    if (resData.isMulti == 0 && props.type == "multi") {
                                                        return Promise.reject("多选题组不能录入单选题")
                                                    }
                                                    let str = ""
                                                    const pro = typeof resData.description == "string" ? JSON.parse(resData.description) : resData.description
                                                    str += pro.content + '\n'
                                                    let len = Object.keys(pro.choice).length
                                                    for (const x of Object.keys(pro.choice)) {
                                                        len -= 1
                                                        str += x + '.' + pro.choice[x]
                                                        if (len > 0) str += '\n'
                                                    }
                                                    proListData[rowIndex].ProblemDescription = str
                                                    setListDataAll(proListData);
                                                    return Promise.resolve()
                                                }
                                            })
                                        }

                                    } else return Promise.resolve()
                                }
                            },
                        })
                    ]
                };
            },
            editable: () => {
                return true
            }
        }]
    const ObjectiveColumns: ProColumns<examProblemType>[] = [
        {
            title: "题目内容",
            dataIndex: 'ProblemDescription',
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}]
                };
            },
            editable: () => {
                return false
            },
            render: (t, record) => {
                return <Paragraph>
                    <pre>{record.ProblemDescription}</pre>
                </Paragraph>
            }
        }]
    const programColumns: ProColumns<examProblemType>[] = [
        {
            title: "题目别名",
            dataIndex: 'ProblemAlias',
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}, {type: "string", min: 1, max: 60}]
                };
            },
            editable: () => {
                return true
            }
        },
        {
            title: "题目描述",
            dataIndex: 'ProblemDescription',
            valueType: "select",
            valueEnum: (row) => getValueEnum(row.ProblemCode),
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}, {type: "string", min: 1, max: 60}]
                };
            },
            editable: () => {
                return true
            }
        },
        {
            title: "提交次数限制",
            dataIndex: "ProblemSubmitNumber",
            editable: () => {
                return true
            }
        }
    ]
    const baseBColumns: ProColumns<examProblemType>[] = [
        {
            title: "题目分数",
            dataIndex: 'ProblemScore',
            valueType: "digit",
            width: 140,
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}, {type: "number", min: 0, max: 100}]
                };
            },
            editable: () => {
                return true
            }
        }
    ];
    const operatorColumns: ProColumns<examProblemType>[] = [
        {
            title: props.t("operator"),
            valueType: 'option',
            width: 80,
            render: (text, record, _, action) => [],
        }
    ]

    // 动态控制列
    let columns: ProColumns<examProblemType>[] = []
    columns = columns.concat(sortColumns)
    columns = columns.concat(baseAColumns)
    if (props.type == "single" || props.type == "multi") columns = columns.concat(ObjectiveColumns)
    if (props.type == "program") columns = columns.concat(programColumns)
    columns = columns.concat(baseBColumns)
    if (!sortSwitch) columns = columns.concat(operatorColumns)

    return (
        <>
            <EditableProTable<examProblemType>
                value={proListData}
                columns={columns}
                rowKey={"id"}
                recordCreatorProps={false}
                actionRef={actionRef}
                editable={{
                    type: 'multiple',
                    form: form,
                    editableKeys: props.isStart || sortSwitch ? [] : editableKeys,
                    actionRender: (row: any, config: any, defDom: any) => {
                        return [
                            <Popconfirm
                                title={props.t("deleteConfirm")}
                                onConfirm={() => {
                                    const data = proListData.filter((value: examProblemType) => value.id != row.id)
                                    setListDataAll(data)
                                    setEditableRowKeys(genNumberList(data))
                                }}
                                okText={props.t("yes")}
                                cancelText={props.t("no")}
                            >
                                <Button type={"link"} size={"small"}> {props.t("delete")} </Button>
                            </Popconfirm>
                        ]
                    },
                    onValuesChange: (record, recordList) => {
                        let NewDate = []
                        for (let i = 0; i < recordList.length; i++) {
                            if (recordList[i].id != undefined)
                                NewDate.push(recordList[i])
                        }
                        setListDataAll(NewDate)
                    },
                    onChange: (keys: React.Key[]) => {
                        setEditableRowKeys(keys)
                    },
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
        </>
    );
}

export default withTranslation()(ProblemAddForm)