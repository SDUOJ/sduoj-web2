import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./Item/ItemUsername";
import ItemPassword from "./Item/ItemPassword";
import ItemEmail from "./Item/ItemEmail";
import React from "react";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"

const Register = (prop: any) => {
    const [form] = useForm()
    return (
        <ModalForm<any>
            title="用户注册"
            trigger={
                prop.button
            }
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnClose: true,
                width: 500,
                okText: "提交"
            }}
            form={form}
            onFinish={async (values) => {
                return CApi.register(values).then((res:any)=>{
                    message.success('注册成功');
                    return true;
                })
            }}
        >
            <ItemUsername ExistCheck={true}/>
            <ItemPassword/>
            <ItemEmail needVerify={true} getEmail={() => {
                return form.validateFields(["email"]).then((data: any) => {
                    return Promise.resolve(data.email)
                }).catch(() => Promise.reject())
            }}/>
        </ModalForm>
    )
}

export default Register