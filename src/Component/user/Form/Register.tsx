import {ModalForm} from "@ant-design/pro-form";
import {message} from "antd";
import ItemUsername from "./ItemUsername";
import ItemPassword from "./ItemPassword";
import ItemEmail from "./ItemEmail";


const Register = (prop: any) => {
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
            onFinish={async (values) => {
                console.log(values);
                message.success('提交成功');
                return true;
            }}
        >
            <ItemUsername/>
            <ItemPassword/>
            <ItemEmail needVerify={true}/>
        </ModalForm>
    )
}

export default Register