import {ModalForm} from "@ant-design/pro-form";
import {message, Tabs} from "antd";
import ItemCaptcha from "./Item/ItemCaptcha";
import React, {useState} from "react";
import {withTranslation} from "react-i18next";
import ItemUsername from "./Item/ItemUsername";
import ItemEmail from "./Item/ItemEmail";
import CApi from "Utils/API/c-api"

const ForgetPass = (props: any) => {

    const [imgId, setImgId] = useState<string>()
    const [active, setActive] = useState<string>("1")

    return (
        <ModalForm<any>
            title={props.t('RetrievePasswordTitle', {defaultValue: props.t('ForgotPassword')})}
            trigger={
                props.button
            }
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnHidden: true,
                width: 500,
                okText: props.t('Send', {defaultValue: 'Send'})
            }}
            onFinish={async (values) => {
                let data: any = {
                    captchaId: imgId,
                    captcha: values.captcha
                }
                if (active === "1") data.username = values.username
                if (active === "2") data.email = values.email
                return CApi.forgetPassword(data).then(()=>{
                    message.success(props.t('PasswordResetLinkSent', {defaultValue: props.t('Success')}));
                    return true
                })
            }}
        >
            <Tabs
                onChange={setActive}
                activeKey={active}>
                <Tabs.TabPane tab={props.t('UsernameTab', {defaultValue: props.t('username')})} key="1">
                    <ItemUsername notRequired={active !== "1"}/>
                </Tabs.TabPane>
                <Tabs.TabPane tab={props.t('EmailTab', {defaultValue: props.t('email')})} key="2">
                    <ItemEmail needVerify={false} notCheck={active !== "2"}/>
                </Tabs.TabPane>
            </Tabs>
            <ItemCaptcha setImgId={setImgId}/>
        </ModalForm>
    )
}

export default withTranslation()(ForgetPass)