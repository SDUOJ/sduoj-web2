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

const {Meta} = Card;

class ERunning extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
    }


    render() {


        return (
            <>
                ERunning
            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const CState: ConfigState = state.ConfigReducer
    const UState: UserState = state.UserReducer
    let userInfo: IUserExamInfo = {
        name: UState.userInfo?.realName,
        studentID: UState.userInfo?.sduId
    }
    return {
        isLogin: UState.isLogin,
        userInfo: userInfo,

        ExamInfoLoad: State.ExamInfoLoad,
        examTitle: State.examInfo?.title,
        examStartTime: State.examInfo?.startTime,
        examDescription: State.examInfo?.description,
        examId: State.examId,

        ExamStartDisable: State.examInfo?.startTime == undefined ?
            true : CState.timestamp < State.examInfo?.startTime
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