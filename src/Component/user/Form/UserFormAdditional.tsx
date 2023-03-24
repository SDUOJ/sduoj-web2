import React, {Component} from "react";
import {withTranslation} from "react-i18next";
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
                <ItemSwitch
                    name={["features", "banInfoUpdate"]}
                    label={this.props.t("DisInfoUpd")}
                />
            </>
        )
    }
}


export default withTranslation()(UserFormAdditional)
