import React, {Component, Dispatch} from "react";
import {Button, Image, Result, Spin} from "antd";
import {ExamState} from "../Type/IExam";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import getUrlParams from "../Utils/getUrlParams";
import {thirdPartyLoginTodo} from "../Redux/Action/user";
import {thirdPartyLoginAction} from "../Type/Iuser";
import CApi from "../Utils/API/c-api";
import SDU_Logo from "../Assert/img/sdu-logo.jpg";


class thirdPartyLogin extends Component<any, any> {

    componentDidMount() {
        const paras = getUrlParams(this.props.location.search)
        console.log(this.props.location.search)
        this.props.thirdPartyLogin({type: paras.thirdParty, data: {ticket: paras.ticket}})
        setInterval(() => {
            CApi.getProfile().then((resData) => {
                if (resData !== null) {
                    this.props.history.goBack()
                }
            })
        }, 1000)
    }


    render() {
        return (
            <div className={"page-center"}>
                <Spin tip="认证中...">
                    <div style={{textAlign: "center", margin: "0 auto"}}>
                        <div>
                            <Image width={200} src={SDU_Logo} preview={false}/>
                        </div>
                        <div>
                            <Button danger type={"primary"}> {this.props.t("SDUAuth")} </Button>
                        </div>
                    </div>
                </Spin>
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    thirdPartyLogin: (data: thirdPartyLoginAction) =>
        dispatch(thirdPartyLoginTodo(data))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(thirdPartyLogin)
    ))
