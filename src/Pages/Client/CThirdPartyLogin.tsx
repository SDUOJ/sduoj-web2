import React, {Component, Dispatch} from "react";
import {Button, Card, Image, message, Space, Spin} from "antd";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {getUrlParams} from "../../Utils/getUrlParams";
import CApi from "../../Utils/API/c-api";
import SDU_Logo from "../../Assert/img/sdu-logo.jpg";
import Register from "../../Component/user/Form/Register";
import Binding from "../../Component/user/Form/Binding";
import {UrlPrefix} from "../../Config/constValue";


class CThirdPartyLogin extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            loading: true,
            thirdParty: "",
            info: "",
            token: "",
            sduId: ""
        }
    }

    componentDidMount() {
        const paras = getUrlParams(this.props.location.search)
        CApi.thirdPartyLogin({
            thirdParty: paras.thirdParty,
            ticket: paras.ticket
        }).then((resData: any) => {
            message.success(this.props.t("certificationSuccess"))
            if (resData.user === null) {
                // 之前没有绑定账号，现在进行绑定
                let obj: any = {
                    loading: false,
                    thirdParty: resData.thirdParty,
                    token: resData.token
                }
                if (resData.thirdParty === "SDUCAS") {
                    Object.assign(obj, {
                        info: resData.sduRealName + " (" + resData.sduId + ")",
                        sduId: resData.sduId
                    })
                }
                this.setState(obj)
            } else {
                this.props.history.push(UrlPrefix + "/home")
            }
        })
    }

    render() {
        return (
            <div className={"center"} style={{width: 450}}>
                {
                    [''].map(() => {
                        if (this.state.loading === true) {
                            return (
                                <Spin tip={this.props.t("certificationIn...")}>
                                    <div style={{textAlign: "center", margin: "0 auto"}}>
                                        <div>
                                            <Image width={200} src={SDU_Logo} preview={false}/>
                                        </div>
                                    </div>
                                </Spin>
                            )
                        } else {
                            return (
                                <>
                                    <Card title={
                                        (
                                            <span>
                                                {this.props.t("firstTimeUse")}
                                                <span style={{fontWeight: "bold"}}>{this.state.thirdParty}</span>
                                                {this.props.t("login,BindingOperationRequired")}
                                            </span>
                                        )
                                    }>

                                        <Space direction={"vertical"} size={15}>
                                            <div style={{textAlign: "left"}}>
                                                {this.props.t("certificationInformation:")}<span
                                                style={{fontWeight: "bold"}}>{this.state.info}</span>
                                            </div>
                                            <div style={{textAlign: "left"}}>
                                                {this.props.t("statuteOfLimitationsCurrentCertification")}<span
                                                style={{fontWeight: "bold"}}>{this.props.t("5Minutes")}</span>{this.props.t("validWithin")}
                                            </div>
                                            <Register token={this.state.token} username={this.state.sduId} button={
                                                <Button block={true} type={"primary"}>{this.props.t("registerAsANewUserAndBind")}</Button>
                                            }/>
                                            <Binding token={this.state.token} button={
                                                <Button block={true} type={"primary"}>{this.props.t("bindExistingAccounts")}</Button>
                                            }/>
                                        </Space>

                                    </Card>
                                </>
                            )
                        }
                    })
                }
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(CThirdPartyLogin)
    ))
