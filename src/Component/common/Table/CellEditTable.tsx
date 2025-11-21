import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import React, {useEffect, useRef, useState} from "react";
import {ActionType, EditableProTable} from "@ant-design/pro-table";

const getRowKeyValue = (row: any, rowKey: any, data: any[]) => {
    const key = row?.[rowKey];
    if (key !== null && key !== undefined) return {value: key, hasRowKey: true};
    const idx = data.findIndex((item: any) => item === row);
    return {value: idx, hasRowKey: false};
}

const buildEditableKeys = (value: any[], rowKey: string) => {
    return value?.map((item: any, idx: number) => {
        const key = item?.[rowKey];
        return key === null || key === undefined ? idx : key;
    }) || []
}

const CellEditTable = (props: any) => {

    const actionRef = useRef<ActionType>();
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])


    useEffect(() => {
        if (props.value && editableKeys.length !== props.value.length)
            setEditableRowKeys(buildEditableKeys(props.value, props.rowKey))
    }, [props.value])


    return <>
        <EditableProTable<any>
            name={props.name}
            headerTitle={props.title}
            columns={props.columns}
            actionRef={actionRef}
            rowKey={props.rowKey}
            value={props.value}
            onChange={(data) => {
                props.onChange && props.onChange(data)
            }}
            recordCreatorProps={false}
            editable={{
                type: 'multiple',
                editableKeys: editableKeys,
                actionRender: (row, config, defaultDoms) => {
                    const buttons = [...(props.rowButton(row, props.value, props.onChange) || [])];
                    const deleteDom = defaultDoms?.delete;
                    const valueData = props.value || [];
                    const {value: rowKeyValue, hasRowKey} = getRowKeyValue(row, props.rowKey, valueData);
                    if (React.isValidElement(deleteDom) && props.onChange) {
                        buttons.push(React.cloneElement(deleteDom as React.ReactElement<any>, {
                            key: "delete",
                            onClick: async (e: any) => {
                                if (deleteDom.props?.onClick) await deleteDom.props.onClick(e);
                                const newData = valueData.filter((item: any, idx: number) => {
                                    if (!hasRowKey) return idx !== rowKeyValue;
                                    return item?.[props.rowKey] !== rowKeyValue;
                                });
                                setEditableRowKeys(buildEditableKeys(newData, props.rowKey));
                                props.onChange(newData);
                            }
                        } as any))
                    } else if (deleteDom) {
                        buttons.push(deleteDom);
                    }
                    return buttons;
                },
                onValuesChange: (record, recordList) => {
                    props.onChange && props.onChange(recordList);
                },
                onChange: setEditableRowKeys,
            }}
        />
        {props.toolBar(actionRef)}
    </>
}

export default withTranslation()(withRouter(CellEditTable))
