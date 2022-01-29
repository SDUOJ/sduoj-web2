import {ManageState} from "../../../Type/IManage";
import React, {Dispatch} from "react";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {Button, Popconfirm} from "antd";
import {DeleteOutlined} from "@ant-design/icons"

const TableRowDeleteButton = (props: any) => {

    const wk = ()=>{
        props.API(props.data).then((value:any)=>{
            props.addTableVersion(props.name)
        })
    }

    let Props:any = {}

    if (props.type === "inline") {
        Props = {
            type: "link",
            size: "small"
        }
    } else {
        Props = {
            type: "primary",
            danger: true,
            icon: <DeleteOutlined/>,
        }
    }

    return (
        <Popconfirm
            title={props.t("deleteConfirm")}
            onConfirm={wk}
            okText={props.t("yes")}
            cancelText={props.t("no")}
        >
            <Button {...Props}> {props.t("delete")} </Button>
        </Popconfirm>
    )
}

const mapStateToProps = (state: any) => {
    const MState: ManageState = state.ManageReducer
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(TableRowDeleteButton)
    ))