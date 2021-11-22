// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import React, {Component, Dispatch} from "react";
import {Button, Card, Skeleton} from "antd";
import {StarOutlined, StarFilled} from '@ant-design/icons';
import Choice from "./Choice";
import {ProNameMap, ProType} from "../../Type/IProblem";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ExamState, SProInfo} from "../../Redux/Reducer/exam";

class Problem extends Component<any, any> {

    componentDidMount() {
        document.oncontextmenu = function (e) {/*屏蔽浏览器默认右键事件*/
            e = e || window.event;
            return false;
        };

        if (this.props.proType === "Program") {
            VditorPreview.preview(
                document.getElementById("problem-content"),
                this.props.markdown
            )
        }
    }

    render() {
        return (
            <Skeleton active loading={this.props.Loading}>
                <Card
                    className={"Problem"}
                    title={
                        <>
                            【{ProNameMap[this.props.proType]}】
                            {
                                [''].map(() => {
                                    if (this.props.index !== undefined) {
                                        return <>{this.props.index}.</>
                                    }
                                })
                            }
                            {
                                [''].map(() => {
                                    if (this.props.score !== undefined) {
                                        return <>（{this.props.score}分）</>
                                    }
                                })
                            }
                        </>
                    }
                    extra={
                        [''].map(() => {
                            if (this.props.flag !== undefined && this.props.flag) {
                                return (
                                    <Button type="default"
                                            shape="round"
                                            icon={this.props.isFlag ? <StarFilled/> : <StarOutlined/>}
                                            danger={this.props.isFlag}
                                            onClick={this.props.flipFlag}
                                    >
                                        标记
                                    </Button>
                                )
                            }
                        })
                    }>

                    {
                        [''].map(() => {
                            switch (this.props.proType) {
                                case "Program":
                                    return (
                                        <div id={"problem-content"} style={this.props.style}>
                                        </div>
                                    )
                                case "SingleChoice":
                                    return (
                                        <Choice index={this.props.TopProblemIndex}/>
                                    )
                                case "MultipleChoice":
                                    return (
                                        <Choice index={this.props.TopProblemIndex}/>
                                    )
                            }
                        })
                    }
                </Card>
            </Skeleton>
        )
    }
}

interface IProblemProp {
    proType: ProType
    markdown?: string
    style?: any
    score?: number
    index?: number
    flag?: boolean
    isFlag?: boolean
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    if (!State.ProListLoad) {
        return {Loading: !State.ProListLoad,}
    } else {
        const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
        return {
            Loading: !State.ProListLoad,
            TopProblemIndex: State.TopProblemIndex === 0 ? undefined : State.TopProblemIndex,
            proType: NowPro.type,
            score: NowPro.score,
            index: NowPro.index,
            isFlag: NowPro.flag
        }
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    flipFlag: () => dispatch({
        type: "flipFlag",
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Problem)