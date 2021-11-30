import React, {Component, Dispatch} from "react";
import {Button, Card} from "antd";
import ThirdPartyLoginSDUCAS from "../user/ThirdPartyLoginSDUCAS";
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";

class ExamLogin extends Component<any, any> {


    constructor(props: any) {
        super(props);
    }

    render() {
        return (
            <>
                <Card
                    title={<Title level={4}> {this.props.t("PleaseLogin")} </Title>}
                    style={{width: "400px", textAlign: "center", margin: "0 auto"}}>
                    <ThirdPartyLoginSDUCAS/>
                </Card>

            </>
        )
    }
}

export default withTranslation()(ExamLogin)