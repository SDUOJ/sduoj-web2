import {Form, Switch} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";

const ItemSwitch01 = (props: any) => {
    return (
        <>
            <Form.Item
                name={props.name}
                label={props.label}
                initialValue={props.InitValue ?? 0}
                rules={[{required: props.required ?? true}]}
            >
                <SwitchX ck={props.ck} unck={props.unck}/>
            </Form.Item>
        </>
    )
}

const SwitchX = (props: any) => {
    const {value, onChange} = props
    return (
        <>
            <Switch
                checked={value === 1}
                onChange={(v) => {
                    onChange(v ? 1 : 0)
                }}
                checkedChildren={props.ck ?? <CheckOutlined/>}
                unCheckedChildren={props.unck ?? <CloseOutlined/>}
            />
        </>
    )
}


export default withTranslation()(ItemSwitch01)