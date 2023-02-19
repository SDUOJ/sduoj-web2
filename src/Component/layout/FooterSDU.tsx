import React, {Dispatch, useEffect} from "react";
import {Layout} from "antd";
import {withTranslation} from "react-i18next";
import {ConfigState} from "../../Type/IConfig";

import {connect} from "react-redux";
import {withRouter} from "react-router";
import cApi from "../../Utils/API/c-api";

const {Footer} = Layout;

const FooterSDU = (props: any) => {

    useEffect(() => {
        if (props.copyRight.length === 0) {
            cApi.getCopyright().then((data: any) => {
                props.setCopyRight(data)
            })
        }
    })

    return (
        <>
            <Footer style={{textAlign: 'center'}}>
                <div dangerouslySetInnerHTML={{__html: props.copyRight}}/>
            </Footer>
        </>
    )

}

const mapStateToProps = (state: any) => {
    const CState: ConfigState = state.ConfigReducer
    return {
        copyRight: CState.copyRight
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setCopyRight: (data: any) => dispatch({type: "setCopyRight", data: data}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(FooterSDU)
    ))
