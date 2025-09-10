import {Popconfirm} from "antd";
import React from "react";
import {useTranslation} from "react-i18next";

const DeleteConfirm = (props: any) => {
    const { t } = useTranslation();
    return (
        <Popconfirm
            title={t("deleteConfirm")}
            onConfirm={props.onConfirm}
            okText={t("yes")}
            cancelText={t("no")}
        >
            {props.content}
        </Popconfirm>
    )
}

export default DeleteConfirm