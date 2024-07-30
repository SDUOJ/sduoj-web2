import React, {useEffect} from "react";
import {useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import Login from "../../Component/user/Login";
import {getUrlParams} from "../../Utils/getUrlParams";
import {UrlPrefix} from "../../Config/constValue";
import {message} from "antd";


const CLogin = (props: any) => {

    const isLogin = useSelector((state: any) => state.UserReducer.isLogin)

    useEffect(() => {
        if (isLogin === true) {
            let to = getUrlParams(props.location.search).to
            if (to === undefined) props.history.replace(UrlPrefix + "/home")
            else {
                props.history.replace(to)
                message.success(props.t("loginSuccessfully"))
            }
        }
    }, [isLogin])

    return (
        <>
            <Login/>
        </>
    )
}

export default withTranslation()(withRouter(CLogin))
