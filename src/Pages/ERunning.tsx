import React, {Component, Dispatch} from "react";
import {Button, Result, Image, Card, Avatar, Descriptions, Skeleton, List} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import {ExamState, IUserExamInfo} from "../Type/IExam";
import {examID} from "../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserInfo, UserState} from "../Type/Iuser";
import {userGetProfileTodo} from "../Redux/Action/user";
import {getExamInfoTodo} from "../Redux/Action/exam";
import {ConfigState} from "../Type/IConfig";
import cookie from "react-cookies";
import ExamRun from "../Component/exam/ExamRun";
import {routerE} from "../Config/router";
import {WaterMark} from "@ant-design/pro-layout";

const {Meta} = Card;

class ERunning extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        if (!this.props.isLogin) {
            this.props.history.push(routerE[0].path)
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (!this.props.isLogin) {
            this.props.history.push(routerE[0].path)
        }
    }

    render() {


        return (
            <>
                <WaterMark
                    rotate={-25}
                    gapX={200}
                    gapY={200}
                    offsetLeft={20}
                    content={this.props.realName + " " + this.props.sduId}
                    fontColor='rgba(212, 212, 212, 0.5)'
                    fontSize={18}
                    zIndex={500}
                >
                    <ExamRun/>
                </WaterMark>

            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    const realName = UState.userInfo?.realName
    const sduId = UState.userInfo?.sduId
    return {
        isLogin: UState.isLogin,
        realName: (realName === undefined || realName === null) ? UState.userInfo?.nickname : UState.userInfo?.realName,
        sduId: (sduId === undefined || sduId === null) ? UState.userInfo?.studentId : UState.userInfo?.sduId,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ERunning)
    ))