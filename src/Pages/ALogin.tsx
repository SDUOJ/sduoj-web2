import React, {Component, Dispatch} from "react";
import {Card} from "antd";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../Type/Iuser";
import {testLoginTodo} from "../Redux/Action/user";
import Login from "../Component/user/Login";


class ALogin extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        if (this.props.isLogin) {
            this.props.history.goBack()
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.isLogin) {
            this.props.history.goBack()
        }
    }

    render() {
        return (
            <>
                <Login/>
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
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ALogin)
    ))