import React from "react";
import {withTranslation} from "react-i18next";
import ItemTitle from "../../../common/Form/Item/ItemTitle";
import ItemEditor from "Component/common/Form/Item/ItemEditor"
import ItemText from "../../../common/Form/Item/ItemText";
import {Form, Radio} from "antd";

const GroupFormProfile = (props: any) => {

    return (
        <>
            <ItemTitle/>
        <ItemText name="description" label={props.t("GroupDescriptionLabel")}/>
        <Form.Item name="openness" label={props.t("Openness")} required>
                <Radio.Group>
            <Radio value={0}>{props.t("OpenPublicOption")}</Radio>
            <Radio value={1}>{props.t("OpenApplyOption")}</Radio>
            <Radio value={2}>{props.t("OpenPrivateOption")}</Radio>
                </Radio.Group>
            </Form.Item>
        <ItemEditor label={props.t("GroupAnnouncement")} name="markdown"/>
        </>
    )
}

export default withTranslation()(GroupFormProfile)