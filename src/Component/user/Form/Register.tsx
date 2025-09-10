import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./Item/ItemUsername";
import ItemPassword from "./Item/ItemPassword";
import ItemEmail from "./Item/ItemEmail";
import React, {useEffect} from "react";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {useDispatch} from "react-redux";


const Register = (props: any) => {
    const [form] = useForm()

    useEffect(() => {
        if (props.token !== undefined)
            form.setFieldsValue({username: props.username})
    }, [props, form])

    const dispatch = useDispatch()

    return (
        <ModalForm<any>
            title={props.token !== undefined ? props.t('RegisterAndBindTitle', {defaultValue: props.t('Register')}) : props.t('UserRegisterTitle', {defaultValue: props.t('Register')})}
            trigger={props.button}
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnHidden: true,
                width: 500,
                okText: props.t('Submit', {defaultValue: 'Submit'})
            }}
            form={form}
            onFinish={async (values) => {
                if (props.token !== undefined) {
                    Object.assign(values, {token: props.token})
                    return CApi.thirdPartyRegister(values).then((res: any) => {
                        dispatch({type: "userLogin"})
                        dispatch({type: "setUserInfo", data: res})
                        message.success(props.t('RegisterSuccess', {defaultValue: props.t('Success')}));
                        return true;
                    })
                } else {
                    return CApi.register(values).then((res: any) => {
                        dispatch({type: "userLogin"})
                        dispatch({type: "setUserInfo", data: res})
                        message.success(props.t('RegisterSuccess', {defaultValue: props.t('Success')}));
                        return true;
                    })
                }
            }}
        >
            <ItemUsername ExistCheck={true} editable={props.token === undefined}/>
            <ItemPassword/>
            <ItemEmail emailVerifyType={props.token !== undefined ? "thirdPartyRegisterOrBinding" : "register"}
                       needVerify={true} getEmail={() => {
                return form.validateFields(["email"]).then((data: any) => {
                    return Promise.resolve(data.email)
                }).catch(() => Promise.reject())
            }}/>
        </ModalForm>
    )
}

// HOC 顺序调整避免类型不兼容，同时用 any 断言规避复杂交叉类型报错
export default withTranslation()(withRouter(Register as any) as any)
