import {Form, Switch} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const ItemTop = (props: any) => {
    return (
        <>
            <Form.Item
                name={"top"}
                label={props.t("IsTop")}
                initialValue={false}
                valuePropName="checked"
                rules={[{required: true}]}
            >
                <Switch
                    checkedChildren={props.t("Top")}
                    unCheckedChildren={props.t("UnTop")}
                />
            </Form.Item>
        </>
    )
}

export default withTranslation()(ItemTop)