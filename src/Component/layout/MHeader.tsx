import React, {Component, Dispatch} from "react";
import UserAvatarBack from "../user/UserAvatarBack";
import {Layout} from "antd";
import ChangeLang from "../common/ChangeLang";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";

const {Header} = Layout;

class MHeader extends Component<any, any> {
    render() {
        return (
            <Header className="site-layout-sub-header-background"
                    style={{minWidth: 550, position: 'fixed', zIndex: 1, width: '100%'}}
            >
                <div style={{float: "right"}}>
                    <div style={{position: "relative", left: "-60%"}}>
                        <ChangeLang/>
                        {
                            (this.props.isLogin && (
                                <UserAvatarBack
                                    email={this.props.email}
                                    username={this.props.username}/>
                            ))
                        }
                    </div>
                </div>
            </Header>
        )
    }
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin,
        email: UState.userInfo?.email,
        username: UState.userInfo?.username,
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
        withRouter(MHeader)
    ))
