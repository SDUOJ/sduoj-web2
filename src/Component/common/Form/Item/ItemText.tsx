import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemText = (props: any) => {
    return (
        <>
            <Form.Item
                label={props.label}
                name={props.name}
                rules={[{required: props.required ?? true}]}
                initialValue={props.initialValue}
            >
                <Input addonAfter={props.addonAfter}/>
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemText)