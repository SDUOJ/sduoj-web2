import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./Item/ItemUsername";
import ItemPassword from "./Item/ItemPassword";
import ItemEmail from "./Item/ItemEmail";
import React from "react";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {withRouter} from "react-router-dom";

const Register = (props: any) => {
    const [form] = useForm()
    return (
        <ModalForm<any>
            title={props.token !== undefined ? "注册并绑定" : "用户注册"}
            trigger={props.button}
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnClose: true,
                width: 500,
                okText: "提交"
            }}
            form={form}
            onFinish={async (values) => {
                if(props.token !== undefined){
                    Object.assign(values, {token: props.token})
                    return CApi.thirdPartyRegister(values).then((res:any)=>{
                        CApi.login(values).then(()=>{
                            props.history.push("/v2/home")
                        })
                        message.success('注册成功');
                        return true;
                    })
                }else{
                    return CApi.register(values).then((res:any)=>{
                        CApi.login(values).then(()=>{
                            props.history.push("/v2/home")
                        })
                        message.success('注册成功');
                        return true;
                    })
                }
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

export default withRouter(Register)