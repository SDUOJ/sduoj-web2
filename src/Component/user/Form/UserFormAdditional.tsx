import React, {Component} from "react";
import {Checkbox, Form, Switch} from "antd";
import {withTranslation} from "react-i18next";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";


class UserFormAdditional extends Component<any, any> {
    render() {
        return (
            <>
                <Form.Item
                    name={["features", "banThirdParty"]}
                    label={this.props.t("Dis3pLogin")}
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                    />
                </Form.Item>
                <Form.Item
                    name={["features", "banEmailUpdate"]}
                    label={this.props.t("DisEmailUpd")}
                    valuePropName="checked"
                >
                    <Switch
                        checkedChildren={<CheckOutlined/>}
                        unCheckedChildren={<CloseOutlined/>}
                    />
                </Form.Item>
            </>
        )
    }
}


export default withTranslation()(UserFormAdditional)
