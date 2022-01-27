import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemNickname = (props: any) => {
    return (
        <Form.Item
            name="nickname"
            label={props.t("nickname")}
            initialValue={props.value}
        >
            <Input/>
        </Form.Item>
    )
}

export default withTranslation()(ItemNickname)