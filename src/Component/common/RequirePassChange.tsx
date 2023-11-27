import SubmitButton from "./SubmitButton";
import CApi from "../../Utils/API/c-api";
import {Form, Modal} from "antd";
import ItemPassword from "../user/Form/Item/ItemPassword";
import React, {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {withTranslation} from "react-i18next";

const RequirePassChange = (props: any) => {
    const [form] = Form.useForm()
    const requirePasswordChange = useSelector((state: any) => state.UserReducer.userInfo?.features?.requirePasswordChange)
    const [passChange, setPassChange] = useState(false)

    useEffect(() => {
        if (requirePasswordChange === 1)
            setPassChange(true)
    }, [requirePasswordChange])


    return (
        <Modal
            title={props.t("更改密码")}
            visible={passChange}
            // closable={false}
            maskClosable={false}
            onCancel={() => {
                setPassChange(false)
            }}
            footer={
                <SubmitButton
                    API={async () => {
                        return form.validateFields().then((data: any) => {
                            return CApi.updatePassword(data).then((res) => {
                                form.resetFields()
                                setPassChange(false)
                                return Promise.resolve(props.t("success"))
                            })
                        }).catch((e: any) => {
                            return Promise.reject(e)
                        })
                    }}
                    btnProps={{type: "default"}}
                    btnText={props.t("update")}
                />
            }
        >
            <p>{props.t("您当前的密码较弱，为了保护您的账号安全，请立即更改密码。")}</p>
            <Form
                form={form}
                layout={"vertical"}
            >
                <ItemPassword oldpass={true}/>
                <ItemPassword newpass={true}/>
            </Form>
        </Modal>
    )
}

export default withTranslation()(RequirePassChange)

