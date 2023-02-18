import {withRouter} from "react-router-dom";
import Reconfirm from "../common/Reconfirm";
import {connect, useSelector} from "react-redux";
import cApi from "Utils/API/c-api"
import {message} from "antd";
import React, {Dispatch} from "react";
import {UrlPrefix} from "../../Config/constValue";
import {useTranslation} from "react-i18next";

const QuitGroupBtn = (props: any) =>{
    const username = useSelector((state:any )=> {
        return state.UserReducer?.userInfo?.username
    })
    const {t} = useTranslation()
    return (
        <>
          <Reconfirm
              btnProps={{type: "link"}}
              btnText={t("exit")}
              confirm={username}
              API={()=>{
                  cApi.quitGroup({groupId: props.groupId}).then(()=>{
                      props.history.replace(UrlPrefix + "/group")
                      message.success(t("successfulExit"))
                      props.addTableVersion("GroupList")
                  })
              }}
              todo={`${t("exitGroup")} ${props.groupName} `}
          />
        </>
    )
}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)( withRouter(QuitGroupBtn) )
