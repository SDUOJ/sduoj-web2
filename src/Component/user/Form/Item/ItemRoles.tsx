import {Form, Select} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemRoles = (props: any) => {
    return (
        <Form.Item
            name="roles"
            label={props.t("roles")}
            rules={[{required: props.editable, message: 'Please select roles!'}]}
            initialValue={props.value}
        >
            <Select mode="multiple" allowClear
                    disabled={props.editable === false}
                    variant={props.editable ? "outlined" : "borderless"}
            >
                <Select.Option value={"user"}>{props.t("user")}</Select.Option>
                <Select.Option value={"admin"}>{props.t("admin")}</Select.Option>
                <Select.Option value={"superadmin"}>{props.t("superadmin")}</Select.Option>
            </Select>
        </Form.Item>
    )
}

export default withTranslation()(ItemRoles)