import {Form, Switch} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import SwitchX from "./SwitchX";

const ItemSwitch01 = (props: any) => {
    return (
        <>
            <Form.Item
                name={props.name}
                label={props.label}
                initialValue={props.InitValue ?? 0}
                required={props.required ?? true}
            >
                <SwitchX ck={props.ck} unck={props.unck}/>
            </Form.Item>
        </>
    )
}




export default withTranslation()(ItemSwitch01)
