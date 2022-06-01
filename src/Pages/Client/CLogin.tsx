import React, {Component, Dispatch} from "react";
import {message} from "antd";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import Login from "../../Component/user/Login";
import {getUrlParams} from "../../Utils/getUrlParams";
import {UrlPrefix} from "../../Config/constValue";


class CLogin extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    testLogin = ()=>{
        if (this.props.isLogin) {
            let to = getUrlParams(this.props.location.search).to
            if (to === undefined) this.props.history.replace(UrlPrefix + "/home")
            else {
                this.props.history.replace(to)
                message.success("登录成功")
            }
        }
    }

    componentDidMount() {
        this.testLogin()
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        this.testLogin()
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
        withRouter(CLogin)
    ))