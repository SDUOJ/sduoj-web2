import React, {Component} from "react";
import {Button} from "antd";
import {withTranslation} from "react-i18next";
import apiAddress from "../../Utils/API/apiAddress";

const server = apiAddress().FRONT_SERVER

class ThirdPartyLoginSDUCAS extends Component<any, any> {
    render() {
        return (
            <>
                <a href={
                    "https://pass.sdu.edu.cn/cas/login?service=" +
                    server + "/thirdPartyLogin?thirdParty=SDUCAS"}>
                    <Button danger type={"primary"}>
                        {
                            this.props.t(
                                this.props.title === undefined ?
                                    "SDUAuth" :
                                    this.props.title)
                        }
                    </Button>
                </a>
            </>
        )
    }
}

export default withTranslation()(ThirdPartyLoginSDUCAS)