import {genNumberList} from "../../Type/IManage";
import {Button, Popconfirm} from "antd";
import React from "react";
import {withTranslation} from "react-i18next";

const DeleteConfirm = (props: any) => {
    return (
        <Popconfirm
            title={props.t("deleteConfirm")}
            onConfirm={props.onConfirm}
            okText={props.t("yes")}
            cancelText={props.t("no")}
        >
            {props.content}
        </Popconfirm>
    )
}

export default withTranslation()(DeleteConfirm)