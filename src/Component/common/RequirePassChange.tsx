import SubmitButton from "./SubmitButton";
import CApi from "../../Utils/API/c-api";
import {Form, Modal} from "antd";
import ItemPassword from "../user/Form/Item/ItemPassword";
import React, {useEffect, useState} from "react";
import {useSelector} from "react-redux";
import {useTranslation} from "react-i18next";

const RequirePassChange = (props: any) => {
    const { t } = useTranslation();
    const [form] = Form.useForm()
    const requirePasswordChange = useSelector((state: any) => state.UserReducer.userInfo?.features?.requirePasswordChange)
    const [passChange, setPassChange] = useState(false)

    useEffect(() => {
        if (requirePasswordChange === 1)
            setPassChange(true)
    }, [requirePasswordChange])


    return (
        <Modal
            title={t("ChangePass")}
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
                return Promise.resolve(t("success"))
                            })
                        }).catch((e: any) => {
                            return Promise.reject(e)
                        })
                    }}
                    btnProps={{type: "default"}}
            btnText={t("update")}
                />
            }
        >
        <p>{t("weakPasswordPrompt")}</p>
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
export default RequirePassChange

