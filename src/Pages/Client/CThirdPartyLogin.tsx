import React, {Component, Dispatch} from "react";
import {Button, Card, Image, message, Space, Spin} from "antd";
import {ExamState} from "../../Type/IExam";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {getUrlParams} from "../../Utils/getUrlParams";
import {thirdPartyLoginAction, thirdPartyLoginDataSDUCAS} from "../../Type/Iuser";
import CApi from "../../Utils/API/c-api";
import SDU_Logo from "../../Assert/img/sdu-logo.jpg";
import {testLoginTodo} from "../../Redux/Action/user";
import Register from "../../Component/user/Form/Register";
import Binding from "../../Component/user/Form/Binding";


class CThirdPartyLogin extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            loading: true,
            thirdParty: "",
            info: "",
            token: ""
        }
    }

    componentDidMount() {
        const paras = getUrlParams(this.props.location.search)
        CApi.thirdPartyLogin({
            thirdParty: paras.thirdParty,
            ticket: paras.ticket
        }).then((resData: any) => {
            message.success("认证成功")
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
                    })
                }
                this.setState(obj)
            } else {
                this.props.history.push("/v2/home")
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
                                <Spin tip="认证中...">
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
                                                首次使用
                                                <span style={{fontWeight: "bold"}}>{this.state.thirdParty}</span>
                                                登录，需要进行绑定操作
                                            </span>
                                        )
                                    }>

                                        <Space direction={"vertical"} size={15}>
                                            <div style={{textAlign: "left"}}>
                                                认证信息：<span style={{fontWeight: "bold"}}>{this.state.info}</span>
                                            </div>
                                            <div style={{textAlign: "left"}}>
                                                时效：当前认证<span style={{fontWeight: "bold"}}>5分钟</span>内有效
                                            </div>
                                            <Register token={this.state.token} button={
                                                <Button block={true} type={"primary"}>注册新用户并绑定</Button>
                                            }/>
                                            <Binding token={this.state.token} button={
                                                <Button block={true} type={"primary"}>绑定已有账号</Button>
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
    const State: ExamState = state.ExamReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(CThirdPartyLogin)
    ))
