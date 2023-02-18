import React, {Component, Dispatch} from "react";
import {withRouter} from "react-router-dom";
import {Card, Col, Divider, Form, FormInstance, message, Row} from "antd";
import Avatar from "../../Component/user/Avatar";
import ItemEmail from "../../Component/user/Form/Item/ItemEmail";
import ItemUsername from "../../Component/user/Form/Item/ItemUsername";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import ItemNickname from "../../Component/user/Form/Item/ItemNickname";
import ItemStudentId from "../../Component/user/Form/Item/ItemStudentId";
import ItemGender from "../../Component/user/Form/Item/ItemGender";
import ItemPhone from "../../Component/user/Form/Item/ItemPhone";
import ItemRoles from "../../Component/user/Form/Item/ItemRoles";
import CApi from "Utils/API/c-api"
import SubmitButton from "../../Component/common/SubmitButton";
import ItemPassword from "../../Component/user/Form/Item/ItemPassword";
import Reconfirm from "../../Component/common/Reconfirm";
import {isValueEmpty} from "../../Utils/empty";
import LoadingData from "../../Component/common/LoadingData";
import {UrlPrefix} from "../../Config/constValue";

class CUser extends Component<any, any> {

    ref1 = React.createRef<FormInstance<any>>()
    ref2 = React.createRef<FormInstance<any>>()
    ref3 = React.createRef<FormInstance<any>>()

    componentDidMount() {
        if (!this.props.isLogin) {
            console.log("not login")
            this.props.history.replace(UrlPrefix + "/login?to=" + this.props.location.pathname)
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (!this.props.isLogin) {
            this.props.history.replace(UrlPrefix + "/login?to=" + this.props.location.pathname)
        }
    }

    render() {
        return (
            <>
                <LoadingData loading={this.props.userInfo === undefined} content={
                    <div style={{textAlign: "center", margin: "0 auto"}}>
                        <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                            <Row style={{marginTop: 0}}>
                                <Col span={16}>
                                    <Card
                                        title={this.props.t("Profile")}
                                    >
                                        <Form
                                            initialValues={this.props.userInfo}
                                            ref={this.ref1}
                                        >
                                            <Row>
                                                <Col span={11}>
                                                    <ItemUsername editable={false}/>
                                                    <ItemNickname/>
                                                    <ItemStudentId/>
                                                    <SubmitButton
                                                        API={async () => {
                                                            return this.ref1.current?.validateFields().then((data: any) => {
                                                                return CApi.updateProfile(data).then((res) => {
                                                                    this.props.testLogin()
                                                                    return Promise.resolve(this.props.t("success"))
                                                                })
                                                            }).catch((e: any) => {
                                                                return Promise.reject(e)
                                                            })
                                                        }}
                                                        btnProps={{type: "default"}}
                                                        btnText={this.props.t("update")}
                                                    />

                                                </Col>
                                                <Col span={11} offset={1}>
                                                    <ItemGender/>
                                                    <ItemPhone/>
                                                    <ItemEmail needVerify={false} editable={false}/>
                                                    <ItemRoles editable={false}/>
                                                </Col>
                                            </Row>

                                        </Form>
                                    </Card>
                                    <Card
                                        style={{marginTop: 30}}
                                        title={this.props.t("ChangePass")}
                                    >
                                        <Form
                                            ref={this.ref2}
                                            layout={"vertical"}
                                        >
                                            <Row>
                                                <Col span={11}>
                                                    <ItemPassword oldpass={true}/>
                                                    <SubmitButton
                                                        API={async () => {
                                                            return this.ref2.current?.validateFields().then((data: any) => {
                                                                return CApi.updateProfile(data).then((res) => {
                                                                    this.ref2.current?.resetFields()
                                                                    return Promise.resolve(this.props.t("success"))
                                                                })
                                                            }).catch((e: any) => {
                                                                return Promise.reject(e)
                                                            })
                                                        }}
                                                        btnProps={{type: "default"}}
                                                        btnText={this.props.t("update")}
                                                    />
                                                </Col>
                                                <Col offset={1} span={11}>
                                                    <ItemPassword newpass={true}/>
                                                </Col>
                                            </Row>
                                        </Form>

                                    </Card>
                                    <Card
                                        style={{marginTop: 30}}
                                        title={this.props.t("modifyEmail")}
                                    >
                                        <Form
                                            ref={this.ref3}
                                            layout={"vertical"}
                                        >
                                            <Row>
                                                <Col span={11}>
                                                    <ItemPassword noConfirm={true}/>
                                                    <SubmitButton
                                                        API={async () => {
                                                            return this.ref3.current?.validateFields().then((data: any) => {
                                                                // console.log(data)
                                                                return CApi.updateEmail(data).then((res) => {
                                                                    this.ref3.current?.resetFields()
                                                                    return Promise.resolve(this.props.t("success"))
                                                                })
                                                            }).catch((e: any) => {
                                                                return Promise.reject(e)
                                                            })
                                                        }}
                                                        btnProps={{type: "default"}}
                                                        btnText={this.props.t("update")}
                                                    />
                                                </Col>
                                                <Col offset={1} span={11}>
                                                    <ItemEmail needVerify={true} getEmail={async () => {
                                                        return this.ref3.current?.validateFields(["email"]).then((data: any) => {
                                                            return Promise.resolve(data.email)
                                                        }).catch(() => {
                                                            return Promise.reject()
                                                        })
                                                    }}/>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Card>
                                </Col>
                                <Col span={7} style={{marginLeft: "30px"}}>
                                    <Card>
                                        <div style={{textAlign: "center", margin: "0 auto"}}>
                                            <div>
                                                <Avatar email={this.props.userInfo?.email} size={150}/><br/>
                                            </div>
                                            <div style={{marginTop: 25}}>
                                                {this.props.t("weUse")} <a
                                                href={"https://cravatar.cn/"}>Cravatar</a> {this.props.t("toPresentYourAvatarIcon")}
                                            </div>

                                        </div>
                                    </Card>
                                    {
                                        [""].map(() => {
                                            if (!isValueEmpty(this.props.userInfo?.sduId)) {
                                                return (
                                                    <Card
                                                        title={`SDUCAS（${this.props.t("sduUnifiedIdentityPlatform")}）`}
                                                        style={{marginTop: 30}}
                                                    >
                                                        <div style={{textAlign: "center", margin: "0 auto"}}>
                                                            {this.props.userInfo.sduId}
                                                            <Divider type={"vertical"}/>
                                                            <Reconfirm
                                                                btnProps={{size: "small", type: "link"}}
                                                                btnText={this.props.t("unbinding")}
                                                                todo={this.props.t("unbindSdusForUnifiedAuthentication")}
                                                                confirm={this.props.userInfo.sduId}
                                                                API={() => {
                                                                    CApi.thirdPartyUnbinding({thirdParty: "SDUCAS"}).then((res: any) => {
                                                                        message.success(this.props.t("unwindingSuccessful"))
                                                                        this.props.testLogin()
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </Card>
                                                )
                                            }
                                        })
                                    }
                                </Col>
                            </Row>
                        </div>
                    </div>}
                />
            </>
        );
    }
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin,
        userInfo: UState.userInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(CUser)
    ))
