import {Table} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {TableState} from "../../../Type/ITable";
import {SizeType} from "antd/lib/config-provider/SizeContext";
import {ColumnsType} from "antd/lib/table/interface";
import {SortableContainer, SortableElement, SortableHandle} from "react-sortable-hoc";
import {MenuOutlined} from "@ant-design/icons";
import {arrayMoveImmutable} from "array-move";

export interface TableWithPaginationProps {
    API: any                  // 表格查询数据的接口
    size: SizeType            // 表格的大小
    columns: ColumnsType<any> // 表格的列
    name: string              // 表格名称
    APIRowsTransForm?: any    // 针对API传输的数据进行转化的函数

    // 面向 可选择的行 开放的接口
    rowKey?: any              // 作为 key 记录的值

}

const TableWithAllData = (props: any) => {
    const [tableData, setTableDataX] = useState([])                            // 表格核心数据
    const [loading, setLoading] = useState(true)                    // 表格的加载状态
    const [tableVersion, setTableVersion] = useState<number>(0)     // 表格版本（控制表格刷新）
    // const [sortSwitch, setSortSwitch] = useState<boolean>(false);           // 操作是否开启排序模式


    const setTableData = (data: any) => {
        setTableDataX(data)
        // 若有 选中行 的相关配置，传递数据进行更新
        if (props.setDataSource !== undefined && props.name !== undefined)
            props.setDataSource(data, props.name)
    }

    const getInfo = () => {
        setLoading(true)
        props.API().then((data: any) => {
            // console.log("data", data)
            if (data === null) data = []
            if (props.APIRowsTransForm !== undefined) {
                setTableData(props.APIRowsTransForm(data))
            } else setTableData(data)
            setLoading(false)
        })
    }

    useEffect(() => {
        getInfo()
    }, [props.name])

    useEffect(() => {
        // 监听表格的版本变化，当版本变更时更新表格
        const propsTableVersion = props.tableData[props.name]?.tableVersion
        if (propsTableVersion !== undefined && tableVersion !== propsTableVersion) {
            // 如果数据被外部应用更新，则用 redux 中的数据更新当前行
            if (propsTableVersion < 0) {
                setTableVersion(-propsTableVersion)
                setTableDataX(props.tableData[props.name]?.dataSource)
            } else {
                // 否则，重新进行请求
                setTableVersion(propsTableVersion)
                getInfo()
            }
        }
    }, [props.tableData, tableVersion])

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
            setTableData(arrayMoveImmutable(tableData, oldIndex, newIndex))
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
        const index = tableData.findIndex((x: any) => x[props.rowKey] === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />
    };
    const sortColumns: any[] = [
        {
            title: "",
            dataIndex: 'sort',
            width: 50,
            className: "drag-visable",
            render: () => <DragHandle/>,
        }
    ]

    let columns = props.columns;
    if (props.useDrag) columns = sortColumns.concat(columns)

    return (
        <Table
            {...props}
            rowSelection={props.rowSelection}
            rowKey={props.rowKey}
            loading={loading}
            size={props.size}
            columns={columns}
            dataSource={tableData}
            pagination={false}
            components={{
                body: {
                    wrapper: DraggableContainer,
                    row: DraggableBodyRow,
                },
            }}
        />
    )

}

const mapStateToProps = (state: any) => {
    const TState: TableState = state.TableReduce
    return {
        tableData: {...TState.tableData}
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setTableInfo: (name: string, data: any) => dispatch({
        type: "setTableInfo",
        name: name,
        data: data
    }),
    setDataSource: (data: any, name: string) =>
        dispatch({type: "setDataSource", data: data, name: name, add: false})
})

export default React.memo(connect(
        mapStateToProps,
        mapDispatchToProps
    )(withTranslation()(
        withRouter(TableWithAllData))), (props: any, nextProps: any) => {
        return props.columns === nextProps.columns &&
            props.rowSelection?.selectedRowKeys.length === nextProps.rowSelection?.selectedRowKeys.length ||
            props.tableData === nextProps.tableData
    }
)

