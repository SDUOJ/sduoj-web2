import React, {Component} from "react";
import {Form, FormInstance, Input} from "antd";
import {WithTranslation, withTranslation} from "react-i18next";
import i18n from "i18next";

interface IUserFormPass extends WithTranslation {
    userForm: React.Ref<FormInstance> | undefined
    initData?: any
}

class UserFormPass extends Component<IUserFormPass, any> {


    constructor(props: Readonly<IUserFormPass> | IUserFormPass) {
        super(props);
        this.state = {
            data: this.props.initData
        }
    }

    onValuesChange = (changedValues: any, allValues: any) => {
        this.setState({data:allValues})

    }

    render() {

        return (
            <>
                <Form
                    name="userPass"
                    layout={"vertical"}
                    ref={this.props.userForm}
                    initialValues={this.state.data}
                    onValuesChange={this.onValuesChange}
                    scrollToFirstError
                >
                    <Form.Item name="password" label={this.props.t("password")}
                               rules={[
                                   {required: true, message: this.props.t("passwordEmpty")},
                               ]}
                               hasFeedback>
                        <Input.Password/>
                    </Form.Item>
                    <Form.Item name="confirm" label={this.props.t("confirmPassword")}
                               dependencies={['password']}
                               hasFeedback
                               rules={[
                                   {required: true, message: this.props.t("passwordEmptyConfirm")},
                                   ({getFieldValue}) => ({
                                       validator(_, value) {
                                           if (!value || getFieldValue('password') === value)
                                               return Promise.resolve();
                                           return Promise.reject(new Error(i18n.t("passwordDifferent")));
                                       },
                                   }),
                               ]}>
                        <Input.Password/>
                    </Form.Item>
                </Form>
            </>
        )
    }
}


export default withTranslation()(UserFormPass)