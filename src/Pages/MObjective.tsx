import React, {Component, Dispatch} from "react";
import {SortableTable} from "../Component/common/sortableTable";
import ObjectiveForm from "../Component/problem/ObjectiveForm";
import {UserState} from "../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";

class MObjective extends Component<any, any> {
    render() {
        return (
            <>
                <ObjectiveForm/>
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
        withRouter(MObjective)
    ))