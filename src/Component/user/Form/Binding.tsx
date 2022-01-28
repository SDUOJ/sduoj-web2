import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./Item/ItemUsername";
import ItemPassword from "./Item/ItemPassword";
import ItemEmail from "./Item/ItemEmail";
import React, {Dispatch} from "react";
import {useForm} from "antd/es/form/Form";
import CApi from "Utils/API/c-api"
import {loginInfo} from "../../../Type/types";
import {testLoginTodo, userLoginTodo} from "../../../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";

const Binding = (props: any) => {
    const [form] = useForm()
    return (
        <ModalForm<any>
            title="绑定已有账号"
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
                Object.assign(values, {token: props.token})
                return CApi.thirdPartyBinding(values).then((res: any) => {
                    props.history.push("/v2/home")
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