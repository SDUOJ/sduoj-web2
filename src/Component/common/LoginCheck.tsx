import {withRouter} from "react-router-dom";
import React, {useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import cApi from "Utils/API/c-api"
import {UrlPrefix} from "../../Config/constValue";

const LoginCheck = (props: any) => {

    const dispatch = useDispatch()
    const isLogin = useSelector((state: any) => state.UserReducer.isLogin)

    useEffect(() => {
        if (isLogin === false) {
            cApi.getProfile().then((res: any) => {
                dispatch({type: "setUserInfo", data: res})
                dispatch({type: "userLogin"})
            }).catch(() => {
                props.jump && props.history.replace(UrlPrefix + "/login?to=" + props.location.pathname)
            })
        }
    }, [isLogin])

    return (
        <></>
    )
}

export default withTranslation()(withRouter(LoginCheck))
