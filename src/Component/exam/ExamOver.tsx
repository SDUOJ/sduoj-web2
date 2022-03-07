import React, {Component, Dispatch} from "react";
import {Button, Popconfirm} from "antd";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import {connect} from "react-redux";
import eApi from "Utils/API/e-api"

class ExamOver extends Component<any, any> {
    state = {
        disabled: false
    }


    render() {
        return (
            <>
                <Popconfirm
                    okType={"primary"}
                    title="交卷后将无法继续作答，你确定要交卷吗？"
                    onConfirm={() => {
                        this.setState({disabled: true})
                        const urls = this.props.location.pathname.split('/')
                        const eid = urls[urls.length - 1]
                        eApi.ExamOver({examId: eid}).then(() => {
                            this.props.history.push("/v2/exam/finish")
                        }).catch(() => {
                            this.setState({disabled: false})
                        })
                    }}
                    okText="确定交卷"
                    cancelText="取消"
                    disabled={this.state.disabled}
                >
                    <Button
                        danger
                        style={{marginRight: "30px"}}
                        type={"primary"}
                        disabled={this.state.disabled}
                    >
                        交卷
                    </Button>
                </Popconfirm>
            </>
        )
    }
}

const mapStateToProps = (state: any) => {
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamOver)
    ))