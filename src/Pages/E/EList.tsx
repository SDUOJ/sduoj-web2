import React, {Component, Dispatch} from "react";
import {Card} from "antd";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import ExamList from "../../Component/exam/ExamList";

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