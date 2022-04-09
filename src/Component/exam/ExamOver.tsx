import React, {Dispatch, useState} from "react";
import {Button, Popconfirm} from "antd";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect, useDispatch} from "react-redux";
import eApi from "Utils/API/e-api"
import {UrlPrefix} from "../../Config/constValue";

const ExamOver = (props: any) => {
    const [disabled, setDisabled] = useState<boolean>(false)
    const dispatch = useDispatch()

    return (
        <>
            <Popconfirm
                okType={"primary"}
                title="交卷后将无法继续作答，你确定要交卷吗？"
                onConfirm={() => {
                    setDisabled(true)
                    const urls = props.location.pathname.split('/')
                    const eid = urls[urls.length - 3]
                    eApi.ExamOver({examId: eid}).then(() => {
                        dispatch({
                            type: "setExamInfo",
                            key: eid,
                            data: undefined
                        })
                        props.history.push(UrlPrefix + "/exam/finish")
                    }).catch(() => {
                        setDisabled(false)
                    })
                }}
                okText="确定交卷"
                cancelText="取消"
                disabled={disabled}
            >
                <Button
                    danger
                    style={{marginRight: "30px"}}
                    type={"primary"}
                    disabled={disabled}
                >
                    交卷
                </Button>
            </Popconfirm>
        </>
    )

}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamOver)
    ))