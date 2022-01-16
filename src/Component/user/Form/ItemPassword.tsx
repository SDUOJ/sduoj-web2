import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemPassword = (props:any) => {
    return (
        <>
            <Form.Item name="password" label={props.t("password")}
                       rules={[
                           {required: true, message: props.t("passwordEmpty")},
                       ]}
                       hasFeedback>
                <Input.Password/>
            </Form.Item>
            <Form.Item name="confirm" label={props.t("confirmPassword")}
                       dependencies={['password']}
                       hasFeedback
                       rules={[
                           {required: true, message: props.t("passwordEmptyConfirm")},
                           ({getFieldValue}) => ({
                               validator(_, value) {
                                   if (!value || getFieldValue('password') === value)
                                       return Promise.resolve();
                                   return Promise.reject(new Error(props.t("passwordDifferent")));
                               },
                           }),
                       ]}>
                <Input.Password/>
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemPassword)