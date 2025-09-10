import React, {Component, Dispatch} from "react";
import ExamForm from "../../Component/exam/Form/ExamForm";
import {Card} from "antd";
import {UserState} from "../../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import ExamList from "../../Component/exam/ExamList";
import {UrlPrefix} from "../../Config/constValue";

class MExam extends Component<any, any> {

    componentDidMount() {
        if (!this.props.isLogin) {
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
                <Card
                    size={"small"}
                    bordered={true}
                    title={this.props.t("examList")}
                    extra={[
                        <ExamForm type={"create"}/>
                    ]}
                >
                    <ExamList type={"manage"}/>
                </Card>


            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(MExam)
    ))