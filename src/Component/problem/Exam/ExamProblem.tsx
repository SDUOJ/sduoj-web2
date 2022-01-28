import React, {Component, Dispatch} from "react";
import {Button, Card, Skeleton} from "antd";
import {StarFilled, StarOutlined} from '@ant-design/icons';
import Choice from "./ExamChoice";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import Program from "./ExamProgram";
import {ExamState, SProGroupInfo, SProInfo} from "../../../Type/IExam";
import {withRouter} from "react-router-dom";
import {examID} from "../../../Type/types";

class ExamProblem extends Component<any, any> {

    componentDidMount() {
        document.oncontextmenu = function (e) {/*屏蔽浏览器默认右键事件*/
            e = e || window.event;
            return false;
        };
    }

    render() {
        return (
            <Skeleton active loading={this.props.Loading}>
                <Card
                    className={"Problem"}
                    title={
                        <>
                            【{this.props.t(this.props.proType)}】
                            {
                                [''].map(() => {
                                    if (this.props.index !== undefined) {
                                        return <>{this.props.index + 1}.</>
                                    }
                                })
                            }
                            {
                                [''].map(() => {
                                    if (this.props.score !== undefined && this.props.isScoreVisible === true) {
                                        return <>（{this.props.score}{this.props.t(this.props.score === 1 ? "point" : "points")}）</>
                                    }
                                })
                            }
                        </>
                    }
                    extra={
                        this.props.proType !== "Program" && this.props.flag !== undefined && this.props.flag && (
                            <Button type="default"
                                    shape="round"
                                    icon={this.props.isFlag ? <StarFilled/> : <StarOutlined/>}
                                    danger={this.props.isFlag}
                                    onClick={()=>this.props.flipFlag(this.props.match.params.eid)}
                            >
                                {this.props.t("Mark")}
                            </Button>
                        )
                    }>

                    {
                        [''].map(() => {
                            switch (this.props.proType) {
                                case "Program":
                                    return (
                                        <Program GroupIndex={this.props.TopGroupIndex}
                                                 ProIndex={this.props.TopProblemIndex}/>
                                    )
                                case "SingleChoice":
                                case "MultipleChoice":
                                    return (
                                        <Choice GroupIndex={this.props.TopGroupIndex}
                                                ProIndex={this.props.TopProblemIndex}/>
                                    )
                            }
                        })
                    }
                </Card>
            </Skeleton>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    if (!State.ProListLoad) {
        return {Loading: !State.ProListLoad,}
    } else {
        const NowGroup = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1];
        const NowPro = (NowGroup.proList as SProInfo[])[State.TopProblemIndex - 1]
        return {
            Loading: !State.ProListLoad,
            TopProblemIndex: State.TopProblemIndex,
            TopGroupIndex: State.TopGroupIndex,
            proType: NowGroup.type,
            score: NowPro.score,
            index: NowPro.index,
            isFlag: NowPro.flag,
            isScoreVisible: State.examInfo?.isScoreVisible
        }
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    flipFlag: (examId: examID) =>  dispatch({
        type: "flipFlag",
        examId: examId
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ExamProblem)))