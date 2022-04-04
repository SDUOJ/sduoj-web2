import React, {Component} from "react";
import {Button} from "antd";
import {withTranslation} from "react-i18next";
import apiAddress from "../../Utils/API/apiAddress";
import {ck} from "../../Utils/empty";
import {UrlPrefix} from "../../Config/constValue";

const server = apiAddress().FRONT_SERVER

class ThirdPartyLoginSDUCAS extends Component<any, any> {
    render() {
        return (
            <>
                <a href={
                    "https://pass.sdu.edu.cn/cas/login?service=" +
                    server + UrlPrefix + "/thirdPartyLogin?thirdParty=SDUCAS"}>
                    <Button danger type={"primary"}>
                        {this.props.t(ck(this.props.title, "SDUAuth"))}
                    </Button>
                </a>
            </>
        )
    }
}

export default withTranslation()(ThirdPartyLoginSDUCAS)