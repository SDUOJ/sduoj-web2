import React, {Component} from "react";

import {IUserPropRoles, Sex} from '../../../Type/Iuser'
import {Form, FormInstance, Input, Radio, Select} from "antd";
import {withTranslation} from "react-i18next";
import {ManOutlined, QuestionOutlined, WomanOutlined} from "@ant-design/icons";
import ItemUsername from "./ItemUsername";
import ItemEmail from "./ItemEmail";

interface IUserFormInfo extends IUserPropRoles{
    userForm: React.Ref<FormInstance<any>> | undefined
    initData? : any
    showUsername: boolean
}

class UserFormProfile extends Component<IUserFormInfo, any> {

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

                    <ItemUsername showUsername={this.props.showUsername}/>

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

                    <ItemEmail needVerify={false}/>

                    <Form.Item name="roles" label={this.props.t("roles")}
                               rules={[{required: true, message: 'Please select gender!'}]}
                               hasFeedback
                    >
                        <Select mode="multiple" allowClear defaultValue={["user"]} disabled={!this.props.roles.includes("superadmin")}>
                            <Select.Option value={"user"}>{this.props.t("user")}</Select.Option>
                            <Select.Option value={"admin"}>{this.props.t("admin")}</Select.Option>
                            <Select.Option value={"superadmin"}>{this.props.t("superadmin")}</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </>
        )
    }
}
export default withTranslation()(UserFormProfile)