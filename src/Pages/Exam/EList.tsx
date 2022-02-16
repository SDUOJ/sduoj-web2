import React, {Component} from "react";
import {withRouter} from "react-router";
import ExamList from "../../Component/exam/ExamList";
import LoginCheck from "../../Component/common/LoginCheck";


class EList extends Component<any, any> {
    render() {
        return (
            <>
                <LoginCheck/>
                <ExamList/>
            </>
        )
    }
}

export default withRouter(EList)