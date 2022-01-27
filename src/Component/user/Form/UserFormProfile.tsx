import React, {Component} from "react";

import {IUserPropRoles, Sex} from '../../../Type/Iuser'
import {Form, FormInstance, Input, Radio, Select} from "antd";
import {withTranslation} from "react-i18next";
import ItemUsername from "./Item/ItemUsername";
import ItemEmail from "./Item/ItemEmail";
import ItemNickname from "./Item/ItemNickname";
import ItemStudentId from "./Item/ItemStudentId";
import ItemPhone from "./Item/ItemPhone";
import ItemGender from "./Item/ItemGender";
import ItemRoles from "./Item/ItemRoles";

interface IUserFormInfo extends IUserPropRoles {
    userForm: React.Ref<FormInstance<any>> | undefined
    initData?: any
    showUsername: boolean
}

class UserFormProfile extends Component<IUserFormInfo, any> {

    render() {


        return (
            <>
                <Form
                    name="userInfo"
                    layout={"vertical"}
                    ref={this.props.userForm}
                    initialValues={this.props.initData}
                    scrollToFirstError>

                    <ItemUsername editable={this.props.showUsername}/>
                    <ItemNickname/>
                    <ItemGender/>
                    <ItemStudentId/>
                    <ItemPhone/>
                    <ItemEmail needVerify={false}/>
                    <ItemRoles/>

                </Form>
            </>
        )
    }
}

export default withTranslation()(UserFormProfile)