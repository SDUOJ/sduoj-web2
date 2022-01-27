import {Button, Form, FormInstance, Input, message, Modal} from "antd";
import React, {useEffect, useState} from "react";
import {withTranslation} from "react-i18next";
import CApi from "Utils/API/c-api"
import ItemCaptcha from "./ItemCaptcha";

const ItemEmail = (props: any) => {
    const [canSend, setCanSend] = useState<number>(0);
    const [modalVis, setModalVis] = useState<boolean>(false);
    const [imgId, setImgId] = useState<string>("")
    const [captcha, setCaptcha] = useState<string>("")
    const [email, setEmail] = useState<string>("")

    const reduce = () => {
        if (canSend > 0) {
            setCanSend(canSend - 1)
        }
    }

    useEffect(() => {
        let intervalId = setInterval(() => reduce(), 1000)
        return () => clearInterval(intervalId)
    })

    return (
        <>
            {props.needVerify === false && (
                <Form.Item name="email" label={props.t("email")}
                           rules={[{type: 'email', message: props.t('emailError'),}]}
                           hasFeedback>
                    <Input
                        disabled={props.editable === false}
                        bordered={props.editable}
                    />
                </Form.Item>
            )}
            {props.needVerify === true && (
                <>
                    <Modal
                        title={"人机身份认证"}
                        visible={modalVis}
                        maskClosable={false}
                        destroyOnClose={true}
                        onOk={() => {
                            CApi.sendVerificationEmail({
                                email: email,
                                captcha: captcha,
                                captchaId: imgId
                            }).then((res) => {
                                message.success("验证码已发送至您的邮箱")
                                setCanSend(60);
                                setModalVis(false)
                            })
                        }}
                        onCancel={() => {
                            setModalVis(false)
                        }}
                    >
                        <ItemCaptcha
                            setImgId={setImgId}
                            setCaptcha={setCaptcha}
                        />
                    </Modal>
                    <Form.Item name="email" label={props.t("email")}
                               rules={[
                                   {type: 'email', message: props.t('emailError'),},
                                   {required: true},
                                   ({getFieldValue}) => ({
                                       validator(_, value) {
                                           return CApi.isExist({email: value}).then((data: any) => {
                                               if (data === false) return Promise.resolve()
                                               else if (data === true) return Promise.reject("邮箱已存在")
                                               return Promise.reject("检验失败")
                                           }).catch((e: any) => {
                                               return Promise.reject(e)
                                           })
                                       },
                                   }),
                               ]}>
                        <Input
                            disabled={props.editable === false || canSend > 0}
                            bordered={props.editable}
                            addonAfter={
                                <Button
                                    type={"text"}
                                    disabled={canSend !== 0}
                                    onClick={() => {
                                        props.getEmail().then((data: string) => {
                                            setEmail(data)
                                            setModalVis(true)
                                        }).catch(() => {
                                            message.error("邮箱不合法")
                                        })
                                    }}
                                >
                                    {(canSend !== 0 ? canSend + "s" : props.t("Verify"))}
                                </Button>
                            }/>
                    </Form.Item>
                    <Form.Item name="emailCode" label={props.t("emailCode")}
                               rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>
                </>
            )}
        </>
    )
}

export default withTranslation()(ItemEmail)