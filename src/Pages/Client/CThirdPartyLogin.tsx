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
    private active = false;


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
        this.active = true;
        const paras = getUrlParams(this.props.location.search)
        CApi.thirdPartyLogin({
            thirdParty: paras.thirdParty,
            ticket: paras.ticket
        }).then((resData: any) => {
            if (!this.active) return;
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
        }).catch((error: any) => {
            if (this.active) this.setState({loading: false, error: error?.message || this.props.t('certificationFailed', {defaultValue: '认证失败，请重试'})})
        })
    }

    componentWillUnmount() {
        this.active = false;
    }

    render() {
        return (
            <div className={"center"} style={{width: 450}}>
                {this.state.error ? <Card>{this.state.error}</Card> : null}
                {
                    ['login'].map((key) => {
                        if (this.state.loading === true) {
                            return (
                                <Spin key={key} tip={this.props.t("certificationIn...")}>
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
