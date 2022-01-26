import React, {Component} from "react";
import {Form, FormInstance} from "antd";
import {WithTranslation, withTranslation} from "react-i18next";
import ItemPassword from "./ItemPassword";

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
                    <ItemPassword/>
                </Form>
            </>
        )
    }
}


export default withTranslation()(UserFormPass)