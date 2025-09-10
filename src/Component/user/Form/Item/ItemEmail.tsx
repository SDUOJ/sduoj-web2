import {Button, Form, Input, message, Modal} from "antd";
import React, {useEffect, useState} from "react";
import {withTranslation} from "react-i18next";
import CApi from "Utils/API/c-api"
import ItemCaptcha from "./ItemCaptcha";
import {emailType} from "../../../../Type/types";

export interface ItemEmailProps {
    needVerify: boolean
    editable: boolean
    getEmail: any
    emailVerifyType: emailType  // 邮箱验证类型
    checkExist?: boolean        // 是否检查邮箱是否存在
    emailTitle?: string         // 标题
    onPressEnter?: any
}

const ItemEmail = (props: ItemEmailProps & any) => {
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
                           rules={props.notCheck !== true ? [
                               {type: 'email', message: props.t('emailError')},
                               {required: props.editable !== false}
                           ] : undefined}
                           hasFeedback>
                    <Input
                        disabled={props.editable === false}
                        variant={props.editable !== false ? "outlined" : "borderless"}
                    />
                </Form.Item>
            )}
            {props.needVerify === true && (
                <>
                    <Modal
                        title={"人机身份认证"}
                        open={modalVis}
                        maskClosable={false}
                        destroyOnHidden={true}
                        onOk={() => {
                            CApi.sendVerificationEmail({
                                email: email,
                                captcha: captcha,
                                captchaId: imgId,
                                event: props.emailVerifyType
                            }).then((res) => {
                                message.success(props.t('VerificationCodeSent', {defaultValue: props.t('Success')}))
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
                    <Form.Item
                        name="email"
                        label={props.emailTitle ?? props.t("new email")}
                        rules={[
                            {required: true},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                    if (!emailRegex.test(value)) {
                                        return Promise.reject(props.t('emailError'));
                                    }
                                    if (props.checkExist === false) return Promise.resolve()
                                    return CApi.isExist({email: value}).then((data: any) => {
                                        if (data === false) return Promise.resolve()
                                        else if (data === true) return Promise.reject(props.t("邮箱已存在"))
                                        return Promise.reject(props.t("检验失败"))
                                    }).catch((e: any) => {
                                        return Promise.reject(e)
                                    })
                                },
                            }),
                        ]}>
                        <Input
                            disabled={props.editable === false || canSend > 0}
                            variant={props.editable !== false ? "outlined" : "borderless"}
                            onPressEnter={props.onPressEnter}
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
                        <Input onPressEnter={props.onPressEnter}/>
                    </Form.Item>
                </>
            )}
        </>
    )
}

export default withTranslation()(ItemEmail)
