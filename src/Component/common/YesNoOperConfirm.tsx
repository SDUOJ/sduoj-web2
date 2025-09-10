import {Popconfirm} from "antd";
import React from "react";
import {withTranslation, useTranslation} from "react-i18next";

const YesNoOperConfirm = (props: any) => {
    const { t } = useTranslation();
    return (
        <Popconfirm
            title={t('AreYouSureToOperate')}
            onConfirm={props.onConfirm}
            okText={t("yes")}
            cancelText={t("no")}
            disabled={props.disabled}
        >
            {props.content}
        </Popconfirm>
    )
}

export default withTranslation()(YesNoOperConfirm)