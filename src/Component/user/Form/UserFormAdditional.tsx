import React, {Component} from "react";
import {Checkbox, Form, Switch} from "antd";
import {withTranslation} from "react-i18next";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import ItemSwitch from "../../common/Form/Item/ItemSwitch";


class UserFormAdditional extends Component<any, any> {
    render() {
        return (
            <>
                <ItemSwitch
                    name={["features", "banThirdParty"]}
                    label={this.props.t("Dis3pLogin")}
                />
                <ItemSwitch
                    name={["features", "banEmailUpdate"]}
                    label={this.props.t("DisEmailUpd")}
                />
            </>
        )
    }
}


export default withTranslation()(UserFormAdditional)
