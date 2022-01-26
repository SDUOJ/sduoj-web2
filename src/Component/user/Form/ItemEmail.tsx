import {Button, Form, Input} from "antd";
import React, {useEffect, useState} from "react";
import {withTranslation} from "react-i18next";

const ItemEmail = (props: any) => {
    const [canSend, setCanSend] = useState<number>(0);

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
                    <Input/>
                </Form.Item>
            )}
            {props.needVerify === true && (
                <>
                    <Form.Item name="email" label={props.t("email")}
                               rules={[
                                   {type: 'email', message: props.t('emailError'),},
                                   {required: true}
                               ]}>
                        <Input addonAfter={
                            <Button
                                type={"text"}
                                disabled={canSend !== 0}
                                onClick={() => {
                                    setCanSend(120);
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