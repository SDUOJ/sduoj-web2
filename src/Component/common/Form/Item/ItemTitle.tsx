import {Form, Input, Switch} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemTitle = (props: any) => {
    return (
        <>
            <Form.Item label={props.label ?? "标题"} name={props.name ?? "title"} rules={[{required: true}]}>
                <Input/>
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemTitle)