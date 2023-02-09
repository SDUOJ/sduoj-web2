import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Button, Form, FormInstance} from "antd";
import React, {useEffect, useRef, useState} from "react";
import {ActionType, EditableProTable} from "@ant-design/pro-table";


const CellEditTable = (props: any) => {

    const actionRef = useRef<ActionType>();
    const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([])


    useEffect(() => {
        if (props.value && editableKeys.length !== props.value.length)
            setEditableRowKeys(props.value?.map((item: any) => item[props.rowKey]))
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
                    return [...(props.rowButton(row, props.value, props.onChange)), defaultDoms.delete];
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
