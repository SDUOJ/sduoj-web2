import React, {Component, Dispatch} from "react";
import {Button, Space, Spin} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons"
import {connect} from "react-redux";
import {ExamAction} from "../../Redux/Action/exam";
import {withTranslation} from "react-i18next";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";


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
    return {
        Loading: !State.ProListLoad,
        TopGroupIndex: State.TopGroupIndex,
        TopProblemIndex: State.TopProblemIndex,
        // 当前题组的题目数量
        ProNumber: State.TopGroupIndex === 0 ? undefined :
            ((State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1].proList as SProInfo[]).length
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    JumpToPro: (GroupIndex: number, ProIndex: number) => dispatch({
        type: "updateTop",
        topGroupIndex: GroupIndex,
        topProIndex: ProIndex
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamPageCtrl))