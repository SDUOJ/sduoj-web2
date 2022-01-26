import React, {Component, Dispatch} from "react";
import {Button, Result, Image, Card, Avatar, Descriptions, Skeleton, List} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../../Component/exam/Timer";
import {ExamState, IUserExamInfo} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserInfo, UserState} from "../../Type/Iuser";
import {testLoginTodo, userGetProfileTodo} from "../../Redux/Action/user";
import {ConfigState} from "../../Type/IConfig";
import cookie from "react-cookies";
import ExamList from "../../Component/exam/ExamList";
import {getRouterPath, routerE} from "../../Config/router";

const {Meta} = Card;

class EList extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        if(!this.props.isLogin){
            this.props.history.push("/v2/login?to=" + this.props.location.pathname)
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if(!this.props.isLogin){
            this.props.history.push("/v2/login?to=" + this.props.location.pathname)
        }
    }

    render() {
        return (
            <>
                <ExamList/>
            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(EList)
    ))