import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemUsername = (props:any) => {
    return (
        <Form.Item name="username" label={props.t("username")}
                   rules={
                       [
                           {required: true, message: props.t("usernameEmpty")},
                       ]
                   }
                   hasFeedback>
            <Input disabled={props.showUsername === false}/>
        </Form.Item>
    )
}

export default withTranslation()(ItemUsername)