import React, {useEffect, useRef, useState} from "react";
import {Button, Popconfirm, Popover, Space} from "antd";
import {CloseOutlined, EditOutlined, MenuOutlined, PlusOutlined, SortAscendingOutlined} from "@ant-design/icons"
import {ActionType, EditableProTable, ProColumns} from "@ant-design/pro-table";
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';
import {withTranslation} from "react-i18next";
import {genNumberList} from "../../../../Type/IManage";
import mApi from "Utils/API/m-api"
import Paragraph from "antd/lib/typography/Paragraph";
import {examProblemType} from "../../../../Type/IExam";
import {ck, get, isValueEmpty} from "../../../../Utils/empty";
import {SketchPicker} from "react-color";

export const defaultKeyMapping = {
    ProblemCode: "ProblemCode",
    ProblemAlias: "ProblemAlias",
    defaultDescriptionId: "defaultDescriptionId",
    ProblemPreview: "ProblemPreview",
    ProblemSubmitNumber: "ProblemSubmitNumber",
    ProblemScore: "ProblemScore",
    problemColor: "problemColor",
    antiCheatingRate: "antiCheatingRate"
}

interface ProblemAddBodyType {
    problemType: "single" | "multi" | "program"
    useSubmitLimit: boolean
    useColor: boolean
    editable: boolean

    initNewLine: any        // 新增一行时，如何根据已有信息
    keyMapping: any

    value: any
    onChange: any
}

const ProblemAddBody = (props: any) => {

    // 可编辑表格的操作引用
    const actionRef = useRef<ActionType>();
    const keyMapping = {...defaultKeyMapping, ...props.keyMapping};

    // === State ===
    const [sortSwitch, setSortSwitch] = useState<boolean>(false);  // 操作是否开启排序模式
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>(genNumberList(ck(props.value, [])));  // 编辑区域构造

    const [TableData, setTableDataX] = useState<any[]>([])
    const [TableDataHis, setTableDataHis] = useState<any>({})
    const setTableData = (data: any) => {
        // console.log("setTableData", data)
        props.onChange && props.onChange(data)
        setTableDataX([...data])
    }

    const [problemInfoLoading, setProblemInfoLoading] = useState<string[]>([])   // 题目信息是否正在加载
    const [problemInfoCache, setProblemInfoCacheX] = useState<any>({})  // 根据题号请求得到的题目信息的缓存
    const setProblemInfoCache = (data: any) => {
        setProblemInfoCacheX({...data})
    }

    const [problemDescriptionLoading, setProblemDescriptionLoading] = useState<string[]>([])   // 题目描述是否正在加载
    const [problemDescriptionCache, setProblemDescriptionCacheX] = useState<{
        [key: string]: {
            DescriptionInfo: any
        }
    }>({})  // 根据题号请求得到的题目描述的缓存
    const setProblemDescriptionCache = (data: any) => {
        setProblemDescriptionCacheX({...data})
    }

    // 执行初始化
    useEffect(() => {
        if (props.value !== undefined && TableData.length === 0) {
            setTableDataX(props.value)
            setEditableRowKeys(genNumberList(props.value))
            for (let x of props.value) {
                let nowKey = x[keyMapping["ProblemCode"]]
                TableDataHis[x.id] = nowKey
                getProblemDescriptionInfo(nowKey)
            }
            setTableDataHis(TableDataHis)
        }
    }, [props, props.value, TableData])

    useEffect(() => {
        // console.log("update", TableData, TableDataHis, problemInfoCache, problemDescriptionCache)
        let newTableData: any[] = [], use = false, useHis = false
        TableData.map((value) => {
            if (strMatch(value[keyMapping["ProblemCode"]]) !== null) {
                let obj: any = {}, updateNum = 0, forceUpdate = false
                // 根据是否已经加载过数据，判断是否更新当前区域
                if (TableDataHis[value.id] !== value[keyMapping["ProblemCode"]]) {
                    TableDataHis[value.id] = value[keyMapping["ProblemCode"]]
                    forceUpdate = true
                    useHis = true
                }

                const check = (nameA: string, arr: any) => {
                    let nowKey = value[keyMapping["ProblemCode"]]
                    if (forceUpdate || (value[nameA] === undefined && get(arr[nowKey], nameA) !== undefined)) {
                        obj[nameA] = get(arr[nowKey], nameA)
                        updateNum += 1
                    }
                }

                check(keyMapping["ProblemAlias"], problemInfoCache)
                check(keyMapping["defaultDescriptionId"], problemInfoCache)
                check(keyMapping["ProblemPreview"], problemInfoCache)
                check("DescriptionInfo", problemDescriptionCache)

                for (const x in value) {
                    if (!(x in obj)) obj[x] = value[x]
                }

                if (updateNum !== 0) {
                    newTableData.push({
                        id: value.id,
                        [keyMapping["ProblemCode"]]: value[keyMapping["ProblemCode"]],
                        ...obj
                    })
                    use = true
                } else newTableData.push(value)
            } else newTableData.push(value)
        })
        // console.log("use", use, "useHis", useHis)
        // console.log("newTableData", newTableData, "TableDataHis", TableDataHis)
        if (use) setTableData(newTableData)
        if (useHis) setTableDataHis(TableDataHis)
    }, [TableData, TableDataHis, problemInfoCache, problemDescriptionCache])

    // console.log("TableData", TableData)

    // === 拖拽排序 ===
    const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);
    const SortableItem = SortableElement((props: any) => <tr {...props} />);
    const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);
    const DraggableContainer = (props: any) => {
        return (
            <XSortableContainer
                useDragHandle
                disableAutoscroll
                helperClass="row-dragging"
                onSortEnd={({oldIndex, newIndex}: any) => {
                    if (oldIndex !== newIndex) setTableData(arrayMoveImmutable(TableData, oldIndex, newIndex))
                }}
                {...props}
            />
        )
    }
    const DraggableBodyRow = ({className, style, ...restProps}: any) => {
        const index = TableData.findIndex((x: any) => x.id === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };

    // 题目信息匹配
    const ProblemType = props.problemType
    const strMatch = (value?: string) => {
        if (value === undefined) return null
        if (ProblemType === "single" || ProblemType === "multi")
            return value.match(/SDUOJ-C-[0-9]{4}$/)
        if (ProblemType === "program")
            return value.match(/SDUOJ-[0-9]{4}$/)
    }

    // 获取题目描述信息
    const getProblemDescriptionInfo = async (problemCode?: string) => {
        if (problemCode === undefined) return {}
        if (problemDescriptionCache[problemCode] !== undefined) {
            return Promise.resolve()
        }
        if (strMatch(problemCode) !== null) {
            if (problemDescriptionLoading.indexOf(problemCode) === -1) {
                problemDescriptionLoading.push(problemCode)
                setProblemDescriptionLoading(problemDescriptionLoading)
                return mApi.getProblemDescriptionList({problemCode: problemCode}).then((resData: any) => {
                        if (resData !== null) {
                            let res: any = {}
                            for (const x of resData) res[x.id] = ({text: x.title})
                            problemDescriptionCache[problemCode] = {"DescriptionInfo": res}
                            setProblemDescriptionCache({...problemDescriptionCache})
                            return Promise.resolve()
                        }
                    }
                ).catch((e) => {
                    setProblemDescriptionLoading(problemDescriptionLoading.filter((val) => val !== problemCode))
                    return Promise.reject(e)
                })
            } else
                return Promise.resolve()

        } else return Promise.reject("题号格式错误")
    }

    const getProblemInfo = async (problemCode: string) => {
        // console.log("getProblemInfo", TableData, problemCode, rowID)
        if (problemCode === undefined) return Promise.reject("此项为必填项")
        if (strMatch(problemCode) !== null) {
            // Cache 命中直接返回
            if (problemInfoCache[problemCode] !== undefined) {
                return Promise.resolve()
            }
            if (problemInfoLoading.indexOf(problemCode) === -1) {
                problemInfoLoading.push(problemCode)
                setProblemInfoLoading(problemInfoLoading)

                const removeProblemCode = () => {
                    setProblemInfoLoading(problemInfoLoading.filter((val) => val !== problemCode))
                }

                switch (ProblemType) {
                    case "program":
                        return mApi.getProblem({problemCode: problemCode}).then((resData: any) => {
                            if (resData === null) return Promise.reject("题目不存在")
                            else {
                                problemInfoCache[problemCode] = {
                                    [keyMapping["ProblemAlias"]]: resData.problemTitle,
                                    [keyMapping["defaultDescriptionId"]]: resData.defaultDescriptionId
                                }
                                setProblemInfoCache(problemInfoCache)
                                return Promise.resolve()
                            }
                        }).catch((e) => {
                            removeProblemCode()
                        })
                    case "single":
                    case "multi":
                        return mApi.getChoiceProblem({problemCode: problemCode}).then((resData: any) => {
                            if (resData === null) return Promise.reject("题目不存在")
                            else {
                                if (resData.isMulti === 1 && ProblemType === "single") return Promise.reject("单选题组不能录入多选题")
                                if (resData.isMulti === 0 && ProblemType === "multi") return Promise.reject("多选题组不能录入单选题")

                                let str = ""
                                const pro = typeof resData.description === "string" ? JSON.parse(resData.description) : resData.description
                                str += pro.content + '\n'
                                let len = Object.keys(pro.choice).length
                                for (const x of Object.keys(pro.choice)) {
                                    len -= 1
                                    str += x + '.' + pro.choice[x]
                                    if (len > 0) str += '\n'
                                }
                                str = str.substr(0, 50)

                                problemInfoCache[problemCode] = {
                                    [keyMapping["ProblemPreview"]]: str
                                }
                                setProblemInfoCache(problemInfoCache)
                                return Promise.resolve()
                            }
                        }).catch((e) => {
                            removeProblemCode()
                            return Promise.reject(e)
                        })
                }
            } else return Promise.resolve()
        } else return Promise.reject("题号格式错误")
    }

    const SortColumnItem: ProColumns[] = [
        {
            title:
                <Button type="text"
                        key="operator"
                        onClick={() => {
                            setSortSwitch(!sortSwitch)
                        }}
                        icon={sortSwitch ? <EditOutlined/> : <SortAscendingOutlined/>}
                        disabled={!props.editable}
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
    const IdColumnItem: ProColumns[] = [
        {
            title: <Button
                type="text"
                onClick={() => {
                    let nData = props.initNewLine(TableData, keyMapping)
                    if (nData[keyMapping["ProblemCode"]] !== undefined) {
                        getProblemInfo(nData[keyMapping["ProblemCode"]]).then(() => {
                            getProblemDescriptionInfo(nData[keyMapping["ProblemCode"]])
                        })
                    }
                    actionRef.current?.addEditRecord?.(nData, {newRecordType: "dataSource", recordKey: Date.now()});
                }}
                icon={<PlusOutlined/>}
                disabled={sortSwitch || !props.editable}
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
        }]
    const ProblemCodeColumnItem: ProColumns[] = [
        {
            title: "题目编号",
            dataIndex: keyMapping["ProblemCode"],
            width: 200,
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [
                        ({getFieldValue}) => ({
                            validator(_, value) {
                                return getProblemInfo(value).then(() => {
                                    return getProblemDescriptionInfo(value)
                                })
                            }
                        })
                    ]
                };
            },
            editable: () => {
                return props.editable
            }
        }
    ]
    const ObjectiveProblemPreviewColumnItem: ProColumns[] = [
        {
            title: "题目预览",
            dataIndex: keyMapping["ProblemPreview"],
            editable: () => {
                return false
            },
            render: (t, record) => {
                return (
                    <Paragraph>
                        <pre className={"preAutoLine"}>{record[keyMapping["ProblemPreview"]]}</pre>
                    </Paragraph>
                )
            }
        }]
    const ProgramingProblemInfoColumnItem: ProColumns[] = [
        {
            title: "题目别名",
            dataIndex: keyMapping["ProblemAlias"],
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
            dataIndex: keyMapping["defaultDescriptionId"],
            valueType: "select",
            valueEnum: (row) => row.DescriptionInfo,
            formItemProps: (form, {rowIndex}) => {
                return {
                    rules: [{required: true, message: '此项为必填项'}, {type: "string", min: 1, max: 60}]
                };
            },
            editable: () => {
                return true
            }
        }
    ]
    const ProblemSubmitLimitColumnItem: ProColumns[] = [
        {
            title: "提交次数限制",
            dataIndex: keyMapping["ProblemSubmitNumber"],
            valueType: "digit",
            width: 140,
            editable: () => {
                return true
            }
        }
    ]
    const ProblemScoreColumnItem: ProColumns[] = [
        {
            title: "题目分数",
            dataIndex: keyMapping['ProblemScore'],
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
    const ProblemAntiCheatColumnItem: ProColumns[] = [
        {
            title: "查重率",
            dataIndex: keyMapping['antiCheatingRate'],
            tooltip: '不填即为不查重，查重系数应在 0.4 - 1 之间',
            valueType: "digit",
            width: 140,
            editable: () => {
                return true
            }
        }
    ];
    const ProblemColorColumnItem: ProColumns[] = [
        {
            title: "气球颜色",
            dataIndex: keyMapping['problemColor'],
            width: 140,
            renderFormItem: () => <ColorPickerBody/>,
        }]
    const OperatorColumnItem: ProColumns<examProblemType>[] = [
        {
            title: props.t("operator"),
            valueType: 'option',
            width: 80,
            render: (text, record, _, action) => [],
        }
    ]

    // 动态控制列
    let columns: ProColumns[] = []
    columns = columns.concat(SortColumnItem)
    columns = columns.concat(IdColumnItem)
    columns = columns.concat(ProblemCodeColumnItem)

    if (ProblemType === "single" || ProblemType === "multi") columns = columns.concat(ObjectiveProblemPreviewColumnItem)
    if (ProblemType === "program") {
        columns = columns.concat(ProgramingProblemInfoColumnItem)
        if (props.useSubmitLimit) columns = columns.concat(ProblemSubmitLimitColumnItem)
        if (props.useColor) columns = columns.concat(ProblemColorColumnItem)
        if (props.useAntiCheating) columns = columns.concat(ProblemAntiCheatColumnItem)
    }
    columns = columns.concat(ProblemScoreColumnItem)

    if (!sortSwitch) columns = columns.concat(OperatorColumnItem)

    // console.log(columns, TableData, props.value)

    return (
        <>
            <EditableProTable
                value={TableData}
                onChange={setTableData}
                controlled={true}
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
                                    const data = TableData.filter((value: any) => value.id !== row.id)
                                    setTableData(data)
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
                            if (recordList[i].id !== undefined)
                                NewDate.push(recordList[i])
                        }
                        setTableData(NewDate)
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

const ColorPickerBody = ({value, onChange}: any) => {

    const [open, setOpen] = useState<boolean>(false);

    useEffect(() => {
        if (value === undefined) {
            onChange("")
        }
    }, [value, onChange])

    return (
        <Space size={12}>
            <Popover
                content={<SketchPicker color={value} onChangeComplete={(v: any) => {
                    onChange(v.hex)
                    setOpen(false)
                }}/>}
                trigger="click"
                visible={open}
                onVisibleChange={setOpen}
            >
                <div style={{
                    background: value,
                    width: 30,
                    height: 30,
                    border: isValueEmpty(value) ? "1px solid #000" : undefined,
                    textAlign: "center",
                    margin: 0,
                    lineHeight: "25px"
                }}
                     onClick={() => setOpen(true)}>
                    {isValueEmpty(value) ? "无" : undefined}
                </div>
            </Popover>
            {!isValueEmpty(value) && (
                <Button icon={<CloseOutlined/>} size={"small"} type={"dashed"} onClick={() => {
                    onChange("")
                }}/>
            )}
        </Space>
    )
}

export default withTranslation()(ProblemAddBody)
