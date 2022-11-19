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
            <ItemText name="description" label={"描述"} required={false}/>
            <Form.Item name="openness" label={"开放性"} required>
                <Radio.Group >
                    <Radio value={0}>公开：任何人可以加入</Radio>
                    <Radio value={1}>申请：需要管理员同意</Radio>
                    <Radio value={2}>私有：不允许加入</Radio>
                </Radio.Group>
            </Form.Item>
            <ItemEditor label={"markdown"} name="markdown"/>
        </>
    )
}

export default withTranslation()(GroupFormProfile)