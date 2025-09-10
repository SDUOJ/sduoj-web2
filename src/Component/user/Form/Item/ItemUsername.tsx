import {Form, Input} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import CApi from "../../../../Utils/API/c-api";

const ItemUsername = (props: any) => {
    return (
        <Form.Item
            name="username"
            label={props.t("username")}
            rules={
                [
                    {
                        required:
                            props.editable !== false && props.notRequired !== true,
                        message: props.t("usernameEmpty")
                    },
                    ({getFieldValue}) => ({
                        validator(_, value) {
                            if (props.ExistCheck === true) {
                                return CApi.isExist({username: value}).then((data: any) => {
                                    if (data === false) return Promise.resolve()
                                    else if (data === true) return Promise.reject("用户名已存在")
                                    return Promise.reject("检验失败")
                                }).catch((e: any) => {
                                    return Promise.reject(e)
                                })
                            }
                            return Promise.resolve()
                        },
                    }),
                ]
            }
            hasFeedback>
            <Input
                disabled={props.editable === false}
                variant={props.editable ? "outlined" : "borderless"}
            />
        </Form.Item>
    )
}

export default withTranslation()(ItemUsername)