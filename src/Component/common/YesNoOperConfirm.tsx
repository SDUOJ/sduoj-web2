import {Popconfirm} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const YesNoOperConfirm = (props: any) => {
    return (
        <Popconfirm
            title={"您确定要进行操作吗？"}
            onConfirm={props.onConfirm}
            okText={props.t("yes")}
            cancelText={props.t("no")}
            disabled={props.disabled}
        >
            {props.content}
        </Popconfirm>
    )
}

export default withTranslation()(YesNoOperConfirm)