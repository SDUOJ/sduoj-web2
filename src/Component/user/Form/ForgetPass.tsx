import {ModalForm} from "@ant-design/pro-form";
import {Form, Input, message, Tabs} from "antd";
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
                let data: any = {
                    captchaId: imgId,
                    captcha: values.captcha
                }
                if (active === "1") data.username = values.username
                if (active === "2") data.email = values.email
                return CApi.forgetPassword(data).then(()=>{
                    message.success('修改密码的链接已发送至您的邮箱');
                    return true
                })
            }}
        >
            <Tabs
                onChange={setActive}
                activeKey={active}>
                <Tabs.TabPane tab="用户名" key="1">
                    <ItemUsername notRequired={active !== "1"}/>
                </Tabs.TabPane>
                <Tabs.TabPane tab="邮箱" key="2">
                    <ItemEmail needVerify={false} notCheck={active !== "2"}/>
                </Tabs.TabPane>
            </Tabs>
            <ItemCaptcha setImgId={setImgId}/>
        </ModalForm>
    )
}

export default withTranslation()(ForgetPass)