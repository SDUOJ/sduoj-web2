import React, {Component, Dispatch} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import ExamRun from "../../Component/exam/ExamRun";
import {WaterMark} from "@ant-design/pro-layout";
import LoginCheck from "../../Component/common/LoginCheck";

class ERunning extends Component<any, any> {

    render() {
        return (
            <>
                <LoginCheck/>
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