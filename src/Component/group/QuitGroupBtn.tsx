import {withRouter} from "react-router-dom";
import Reconfirm from "../common/Reconfirm";
import {connect, useSelector} from "react-redux";
import cApi from "Utils/API/c-api"
import {message} from "antd";
import React, {Dispatch} from "react";
import {UrlPrefix} from "../../Config/constValue";

const QuitGroupBtn = (props: any) =>{
    const username = useSelector((state:any )=> {
        return state.UserReducer?.userInfo?.username
    })
    return (
        <>
          <Reconfirm
              btnProps={{type: "link"}}
              btnText={"退出"}
              confirm={username}
              API={()=>{
                  cApi.quitGroup({groupId: props.groupId}).then(()=>{
                      props.history.replace(UrlPrefix + "/group")
                      message.success("退出成功")
                      props.addTableVersion("GroupList")
                  })
              }}
              todo={`退出组 ${props.groupName} `}
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
