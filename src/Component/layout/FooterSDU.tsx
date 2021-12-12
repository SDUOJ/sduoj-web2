import React, {Component, Dispatch} from "react";
import {Layout} from "antd";
import {withTranslation} from "react-i18next";
import {ConfigState} from "../../Type/IConfig";

import {connect} from "react-redux";
import {withRouter} from "react-router";
import {getCopyRightTodo} from "../../Redux/Action/config";

const {Footer, Content} = Layout;

class FooterSDU extends Component<any, any> {

    componentDidMount() {
        if (this.props.copyRight.length === 0)
            this.props.getCopyRight()
    }

    render() {
        return (
            <>
                <Footer style={{textAlign: 'center'}}>
                    <div dangerouslySetInnerHTML={{__html: this.props.copyRight}}/>
                </Footer>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const CState: ConfigState = state.ConfigReducer
    return {
        copyRight: CState.copyRight
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getCopyRight: () => dispatch(getCopyRightTodo()),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(FooterSDU)
    ))
