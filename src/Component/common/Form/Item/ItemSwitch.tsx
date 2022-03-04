import {Form, Input, Switch} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";

const ItemSwitch = (props: any) => {
    return (
        <>
            <Form.Item
                name={props.name}
                label={props.label}
                valuePropName="checked"
                initialValue={props.InitValue ?? false}
                rules={[{required: props.required ?? true}]}
            >
                <Switch
                    checkedChildren={props.ck ?? <CheckOutlined/>}
                    unCheckedChildren={props.unck ?? <CloseOutlined/>}
                />
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemSwitch)