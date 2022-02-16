import React, {Component, Dispatch} from "react";
import {Button, Space, Spin} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons"
import {connect} from "react-redux";
import {ExamAction} from "../../Redux/Action/exam";
import {withTranslation} from "react-i18next";
import {ExamState, SProInfo} from "../../Type/IExam";


class ExamPageCtrl extends Component<any, any> {
    render() {
        return (
            <div className={"ExamPageCtrl"}>
                <Space>
                    <Button shape="round" type={"primary"}
                            disabled={this.props.TopProblemIndex === 1 || this.props.Loading}
                            onClick={() => this.props.JumpToPro(this.props.TopGroupIndex, this.props.TopProblemIndex - 1)}
                    >
                        <LeftOutlined/> {this.props.t("PreviousProblem")}
                    </Button>
                    <Spin spinning={this.props.Loading}>
                        <div className={"ExamPageCtrl-Number"}>
                            <span> {this.props.TopProblemIndex} </span>
                            /
                            <span> {this.props.ProNumber} </span>
                        </div>
                    </Spin>
                    <Button shape="round" type={"primary"}
                            disabled={this.props.TopProblemIndex === this.props.ProNumber || this.props.Loading}
                            onClick={() => this.props.JumpToPro(this.props.TopGroupIndex, this.props.TopProblemIndex + 1)}
                    >
                        {this.props.t("NextProblem")} <RightOutlined/>
                    </Button>
                </Space>
            </div>
        )
    }

}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamPageCtrl))