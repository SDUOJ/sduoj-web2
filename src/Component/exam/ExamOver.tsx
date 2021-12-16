import React, {Component, Dispatch} from "react";
import {Button} from "antd";
import {UserState} from "../../Type/Iuser";
import {userGetProfileTodo, userLogoutTodo} from "../../Redux/Action/user";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import eApi from "Utils/API/e-api"
import {cleanProInfo} from "../../Redux/Action/exam";

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
                    onClick={() => {
                        this.setState({disabled: true})
                        const urls = this.props.location.pathname.split('/')
                        const eid = urls[urls.length - 1]
                        eApi.ExamOver({examId: eid}).then(() => {
                            this.props.history.push("/v2/exam/finish")
                            this.props.CleanProInfo()
                        }).catch(() => {
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
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    CleanProInfo: () => dispatch({
        type: "cleanProInfo"
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamOver)
    ))