import React, {Component, Dispatch} from "react";
import {Badge, Button, Col, Popover, Progress, Row, Space, Tag} from "antd";
import {ClockCircleOutlined} from "@ant-design/icons";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent, isProgramContent} from "../../Type/IProblem";
import {withTranslation} from "react-i18next";
import {GetMaxScore, getPoint, IsAnswer} from "../../Utils/Problem";
import {ExamState, SProInfo} from "../../Type/IExam";


class ProTag extends Component<any, any> {

    render() {
        let TagState = [], score: any = undefined, isProgram = false
        if (this.props.TagState !== undefined) {
            TagState = this.props.TagState
        } else if (this.props.ProInfo !== undefined) {
            const NowPro = (this.props.ProInfo as SProInfo[])[this.props.ProIndex - 1]
            // console.log(NowPro)
            if (NowPro.content === undefined) {
                TagState.push("d")
            } else {
                if (isProgramContent(NowPro.content)) {
                    score = GetMaxScore(NowPro.content)
                    isProgram = true
                }
                if (IsAnswer(NowPro.content)) TagState.push("f")
                else TagState.push("d")
            }
            if (NowPro.flag) TagState.push("c")
        }

        const tagComp = (
            <Space>
                <a className={"ProTag"}
                   onClick={this.props.ProIndex !== 0 ? (() => this.props.JumpToPro(this.props.ProIndex)) : undefined}
                >
                    <Badge dot={TagState.indexOf("c") !== -1}>
                        <Tag color={
                            this.props.ProIndex != 0 && this.props.ProIndex == this.props.TopProblemIndex ?
                                (TagState.indexOf("f") !== -1 ? "#87d068" : "#2db7f5") :
                                (TagState.indexOf("f") !== -1 ? "green" : undefined)
                        }>
                            {
                                [''].map(() => {
                                    if (this.props.ProIndex !== 0) {
                                        return this.props.ProIndex
                                    } else return (<>&nbsp;&nbsp;</>)
                                })
                            }
                        </Tag>
                    </Badge>
                </a>
                {
                    [''].map(() => {
                        if (this.props.ProIndex === 0) {
                            return <span style={{color: "black", marginLeft: "-10px"}}>{this.props.exp}</span>
                        }
                    })
                }
            </Space>
        )

        return (
            <div>
                {
                    [''].map(() => {
                        if (isProgram) {
                            return (
                                <Popover
                                    content={
                                        <>
                                            <Progress
                                                percent={score}
                                                steps={20}
                                                size="small"
                                                strokeColor="#52c41a"
                                                format={percent => `${percent}` + this.props.t(getPoint(percent))}
                                            />
                                        </>
                                    }
                                >
                                    {tagComp}
                                </Popover>
                            )
                        } else {
                            return tagComp
                        }
                    })
                }

            </div>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {
        ProInfo: State.proInfo,
        TopProblemIndex: State.TopProblemIndex,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    JumpToPro: (ProIndex: number) => dispatch({
        type: "updateTop",
        topIndex: ProIndex
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProTag))