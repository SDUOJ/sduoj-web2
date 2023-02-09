import {Switch} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import React from "react";

const SwitchX = (props: any) => {
    const {value, onChange} = props

    return (
        <>
            <Switch
                checked={value === 1}
                onChange={(v) => {
                    onChange(v ? 1 : 0)
                }}
                checkedChildren={props.ck ?? <CheckOutlined/>}
                unCheckedChildren={props.unck ?? <CloseOutlined/>}
            />
        </>
    )
}
export default SwitchX;
