import React, {Component, Dispatch} from "react";
import ObjectiveForm from "../Component/problem/ObjectiveForm";
import {UserState} from "../Type/Iuser";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Card, Space} from "antd";
import ProblemList from "../Component/problem/ProblemList";
import AutoImportObjective from "../Component/problem/AutoImportObjective";
import {getRouterPath, routerC} from "../Config/router";

class MObjective extends Component<any, any> {

    componentDidMount() {
        if (!this.props.isLogin) {
            this.props.history.push(getRouterPath(routerC, 1))
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (!this.props.isLogin) {
            this.props.history.push(getRouterPath(routerC, 1))
        }
    }

    render() {
        return (
            <>
                <Card
                    size={"small"}
                    bordered={false}
                    title={"客观题列表"}
                    extra={
                        <Space>
                            <ObjectiveForm isDataLoad={true} type={"create"}/>
                            <AutoImportObjective/>
                        </Space>
                    }
                >
                    <ProblemList type="objective"/>
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
        withRouter(MObjective)
    ))