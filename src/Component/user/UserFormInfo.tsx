import React, {Component} from "react";

import {IUserPropRoles, Role, Sex} from '../../Type/Iuser'
import {Form, FormInstance, Input, Radio, Select} from "antd";
import {withTranslation} from "react-i18next";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";

interface IUserFormInfo extends IUserPropRoles{
    userForm: React.Ref<FormInstance<any>> | undefined
    initData? : any
    showUsername: boolean
}

class UserFormInfo extends Component<IUserFormInfo, any> {

    render() {

        const options = [
            {label: <ManOutlined/>, value: Sex.Male},
            {label: <WomanOutlined/>, value: Sex.Female},
            {label: <QuestionOutlined/>, value: Sex.Unknown},
        ];

        return (
            <>
                <Form
                    name="userInfo"
                    layout={"vertical"}
                    ref={this.props.userForm}
                    initialValues={this.props.initData}
                    scrollToFirstError>

                    <Form.Item name="username" label={this.props.t("username")}
                               rules={[{required: this.props.showUsername, message: this.props.t("usernameEmpty")}]}
                               hasFeedback>
                        <Input disabled={!this.props.showUsername}/>
                    </Form.Item>

                    <Form.Item name="nickname" label={this.props.t("nickname")}>
                        <Input/>
                    </Form.Item>

                    <Form.Item name="sex" label={this.props.t("sex")}>
                        <Radio.Group
                            options={options}
                            defaultValue={Sex.Unknown}
                            optionType="button"
                            buttonStyle="solid"
                        />
                    </Form.Item>

                    <Form.Item name="student_id" label={this.props.t("student_id")}>
                        <Input/>
                    </Form.Item>

                    <Form.Item name="phone" label={this.props.t("phone")}>
                        <Input/>
                    </Form.Item>

                    <Form.Item name="email" label={this.props.t("email")}
                               rules={[{type: 'email', message: this.props.t('emailError'),}]}
                               hasFeedback>
                        <Input/>
                    </Form.Item>

                    <Form.Item name="roles" label={this.props.t("roles")}
                               rules={[{required: true, message: 'Please select gender!'}]}
                               hasFeedback
                    >
                        <Select mode="multiple" allowClear defaultValue={[Role.User]}>
                            {
                                [
                                    <Select.Option value={Role.User}>{this.props.t("user")}</Select.Option>,
                                    <Select.Option value={Role.Admin}>{this.props.t("admin")}</Select.Option>,
                                    <Select.Option value={Role.SuperAdmin}>{this.props.t("superadmin")}</Select.Option>
                                ].map((x, index) => {
                                    if (index === 0) return x;
                                    else if (this.props.roles.includes(Role.SuperAdmin)) return x;
                                    else return <></>
                                })
                            }
                        </Select>
                    </Form.Item>
                </Form>
            </>
        )
    }
}


export default withTranslation()(UserFormInfo)