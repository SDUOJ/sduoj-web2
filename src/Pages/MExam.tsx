import React, {Component, Dispatch} from "react";
import ExamForm from "../Component/exam/Form/ExamForm";
import ExamBaseForm from "../Component/exam/Form/ExamBaseForm";
import {FormInstance} from "antd";
import {getRouterPath, routerC, routerE} from "../Config/router";
import {UserState} from "../Type/Iuser";
import {testLoginTodo} from "../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";

class MExam extends Component<any, any> {



    constructor(props: any, context: any) {
        super(props, context);

    }

    componentDidMount() {
        if(!this.props.isLogin){
            // sessionStorage.setItem("returnPath", getRouterPath(routerE, 2))
            this.props.history.push(getRouterPath(routerC, 1))
            window.location.reload();
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if(!this.props.isLogin){
            // sessionStorage.setItem("returnPath", getRouterPath(routerE, 2))
            this.props.history.push(getRouterPath(routerC, 1))
            window.location.reload();
        }
    }

    render() {
        return (
            <>
                <ExamForm type={"create"}/>
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

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(MExam)
    ))