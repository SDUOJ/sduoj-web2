import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./Item/ItemUsername";
import ItemPassword from "./Item/ItemPassword";
import React from "react";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {useDispatch} from "react-redux";
import {UrlPrefix} from "../../../Config/constValue";

const Binding = (props: any) => {
    const [form] = useForm()
    const dispatch = useDispatch()
    return (
        <ModalForm<any>
            title="绑定已有账号"
            trigger={props.button}
            autoFocusFirstInput
            modalProps={{
                maskClosable: false,
                destroyOnHidden: true,
                width: 500,
                okText: "提交"
            }}
            form={form}
            onFinish={async (values) => {
                Object.assign(values, {token: props.token})
                return CApi.thirdPartyBinding(values).then((res: any) => {
                    dispatch({type: "userLogin"})
                    dispatch({type: "setUserInfo", data: res})
                    props.history.push(UrlPrefix + "/home")
                    message.success('绑定成功');
                    return true;
                })
            }}
        >
            <ItemUsername/>
            <ItemPassword noConfirm={true}/>
        </ModalForm>
    )
}


export default withTranslation()(
    withRouter(Binding)
)
