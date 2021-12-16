import React, {Component, Dispatch} from "react";
import {Button} from "antd";
import {UserState} from "../../Type/Iuser";
import {userGetProfileTodo, userLogoutTodo} from "../../Redux/Action/user";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import eApi from "Utils/API/e-api"

class ExamOver extends Component<any, any> {
    state = {
        disabled: false
    }


    render() {
        return (
            <>
                <Button
                    danger
                    style={{marginRight: "30px"}}
                    type={"primary"}
                    onClick={()=>{
                        this.setState({disabled: true})
                        eApi.ExamOver({examId: this.props.match.params.eid}).then(()=>{
                            this.props.history.push("/v2/exam/finish")
                        }).catch(()=>{
                            this.setState({disabled: false})
                        })
                    }}
                    disabled={this.state.disabled}
                >
                    交卷
                </Button>
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

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    userLogout: () => dispatch(userLogoutTodo()),
    getProfile: () => dispatch(userGetProfileTodo()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamOver)
    ))