import React, {Component, Dispatch} from "react";
import {Badge, Button, Col, Popover, Progress, Row, Space, Tag} from "antd";
import {CaretUpFilled} from "@ant-design/icons";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent, isProgramContent} from "../../Type/IProblem";
import {withTranslation} from "react-i18next";
import {GetMaxScore, getPoint, IsAnswer} from "../../Utils/Problem";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";


class ProTag extends Component<any, any> {


    state: any = {
        TagState: [],
        score: undefined,
        isProgram: false
    }

    componentDidMount() {
        this.updateState = this.updateState.bind(this)
        this.updateState()
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.GroupIndex != undefined) {
            if (prevProps.AnswerSheetLoad[this.props.GroupIndex] == false &&
                this.props.AnswerSheetLoad[this.props.GroupIndex] == true) {
                this.updateState()
            }
            const ProInfo = this.props.GroupInfo[this.props.GroupIndex].proList
            const PreProInfo = prevProps.GroupInfo[this.props.GroupIndex].proList
            if (ProInfo !== undefined && PreProInfo !== undefined) {
                const NowPro = (ProInfo as SProInfo[])[this.props.ProIndex - 1]
                const PrePro = (PreProInfo as SProInfo[])[this.props.ProIndex - 1]
                if (NowPro.content !== undefined && PrePro.content !== undefined) {
                    if (IsAnswer(NowPro.content) != IsAnswer(PrePro.content)) {
                        this.updateState()
                    }
                    if(NowPro.flag != PrePro.flag){
                        this.updateState()
                    }
                    if (isProgramContent(NowPro.content) && isProgramContent(PrePro.content)) {
                        if(GetMaxScore(NowPro.content) != GetMaxScore(PrePro.content))
                            this.updateState()
                    }
                }
            }
        }
        return true
    }

    updateState() {
        let TagState = [], score = undefined, isProgram = false
        if (this.props.TagState !== undefined) {
            TagState = this.props.TagState
        } else {
            const ProInfo = this.props.GroupInfo[this.props.GroupIndex].proList
            if (ProInfo !== undefined) {
                const NowPro = (ProInfo as SProInfo[])[this.props.ProIndex - 1]
                if (NowPro.content !== undefined) {
                    if (isProgramContent(NowPro.content)) {
                        score = GetMaxScore(NowPro.content)
                        isProgram = true
                    }
                    if (IsAnswer(NowPro.content)) TagState.push("f")
                }
                if (NowPro.flag) TagState.push("c")
            }
        }

        this.setState({
            TagState: TagState,
            score: score,
            isProgram: isProgram
        })
    }

    render() {
        const TagState = this.state.TagState, score = this.state.score, isProgram = this.state.isProgram

        const tagComp = (
            <div className={"tag-div"}>
                <Space>
                    <a className={"ProTag"}
                       onClick={this.props.ProIndex !== 0 ?
                           (() => this.props.JumpToPro(this.props.GroupIndex + 1, this.props.ProIndex)) : undefined}
                    >
                        <Badge dot={TagState.indexOf("c") !== -1}>
                            <Tag color={(TagState.indexOf("f") !== -1 ? "green" : undefined)}>
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
                {
                    this.props.ProIndex != 0
                    && this.props.ProIndex == this.props.TopProblemIndex
                    && this.props.GroupIndex + 1 == this.props.TopGroupIndex && (
                        <div className={"nowPro"}/>
                    )
                }
            </div>

        )

        return (
            <div>
                {
                    [''].map(() => {
                       if (isProgram &&
                            this.props.GroupInfo !== undefined &&
                            this.props.GroupInfo[this.props.GroupIndex].proList !== undefined &&
                            this.props.GroupInfo[this.props.GroupIndex].proList[this.props.ProIndex - 1].content !== undefined
                        ) {
                            const sumScore = this.props.GroupInfo[this.props.GroupIndex].proList[this.props.ProIndex - 1].content.SumScore
                            return (
                                <Popover
                                    content={
                                        <>
                                            <Progress
                                                percent={score / sumScore * 100}
                                                steps={20}
                                                size="small"
                                                strokeColor="#52c41a"
                                                format={percent => `${percent}` + "%"}
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
        AnswerSheetLoad: State.AnswerSheetLoad,
        GroupInfo: State.proGroupInfo,
        TopProblemIndex: State.TopProblemIndex,
        TopGroupIndex: State.TopGroupIndex,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    JumpToPro: (GroupIndex: number, ProIndex: number) => dispatch({
        type: "updateTop",
        topProIndex: ProIndex,
        topGroupIndex: GroupIndex
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProTag))