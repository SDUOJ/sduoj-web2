import {ModalForm} from "@ant-design/pro-form";
import {Form, Input, message} from "antd";
import ItemCaptcha from "./Item/ItemCaptcha";
import React, {useState} from "react";
import {withTranslation} from "react-i18next";


const ForgetPass = (props: any) => {

    const [imgId, setImgId] = useState<string>()

    return (
        <ModalForm<any>
            title="找回密码"
            trigger={
                props.button
            }
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnClose: true,
                width: 500,
                okText: "发送"
            }}
            onFinish={async (values) => {
                console.log(values);
                message.success('提交成功');
                return true;
            }}
        >
            <Form.Item
                name="usernameOrEmail"
                label={props.t("usernameOrEmail")}
                rules={[
                    {required: true},
                ]}
            >
                <Input/>
            </Form.Item>
            <ItemCaptcha setImgId={setImgId}/>
        </ModalForm>
    )
}

export default withTranslation()(ForgetPass)