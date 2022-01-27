import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemPhone = (props: any) => {
    return (
        <Form.Item
            name="phone"
            label={props.t("phone")}
            initialValue={props.value}
        >
            <Input/>
        </Form.Item>
    )
}

export default withTranslation()(ItemPhone)