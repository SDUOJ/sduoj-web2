import React, {Component} from "react";
import {Checkbox, Form, FormInstance} from "antd";
import {WithTranslation, withTranslation} from "react-i18next";

interface IUserFormAdditional extends WithTranslation {
    userForm: React.Ref<FormInstance<any>> | undefined
    initData? : any
}

class UserFormAdditional extends Component<IUserFormAdditional, any> {
    render() {
        return (
            <>
                <Form
                    name="userAdditional"
                    layout={"vertical"}
                    ref={this.props.userForm}
                    initialValues={this.props.initData}
                    scrollToFirstError
                >
                    <Form.Item name="Dis3pLogin">
                        <Checkbox>{this.props.t("Dis3pLogin")}</Checkbox>
                    </Form.Item>
                    <Form.Item name="DisEmailUpd">
                        <Checkbox>{this.props.t("DisEmailUpd")}</Checkbox>
                    </Form.Item>
                </Form>
            </>
        )
    }
}


export default withTranslation()(UserFormAdditional)
