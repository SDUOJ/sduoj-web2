import React, {Component, Dispatch} from "react";
import {Badge, Button, Col, Row, Tag} from "antd";
import {ClockCircleOutlined} from "@ant-design/icons";
import {ExamState, IsAnswer, SProInfo} from "../../Redux/Reducer/exam";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent} from "../../Type/IProblem";


class ProTag extends Component<any, any> {

    render() {
        let TagState = []
        if (this.props.TagState !== undefined) {
            TagState = this.props.TagState
        } else if (this.props.ProInfo !== undefined){
            const NowPro = (this.props.ProInfo as SProInfo[])[this.props.ProIndex - 1]
            if (NowPro.content === undefined) {
                TagState.push("d")
            } else {
                if (IsAnswer(NowPro.content as ChoiceContent)) TagState.push("f")
                else TagState.push("d")
            }
            if (NowPro.flag) TagState.push("c")
        }

        return (
            <div>
                <Row>
                    <Col span={this.props.ProIndex === 0 ? 12 : 24}>
                        <a className={"ProTag"}
                           onClick={this.props.ProIndex !== 0 ? (() => this.props.JumpToPro(this.props.ProIndex)) : undefined}
                        >
                            <Badge dot={TagState.indexOf("c") !== -1}>
                                <Tag color={TagState.indexOf("f") !== -1 ? "green" : undefined}>{
                                    [''].map(() => {
                                        if (this.props.ProIndex !== 0) {
                                            return this.props.ProIndex
                                        } else return (<>&nbsp;&nbsp;</>)
                                    })
                                }</Tag>
                            </Badge>
                        </a>
                    </Col>
                    <Col span={this.props.ProIndex === 0 ? 12 : 0}>
                        {
                            [''].map(() => {
                                if (this.props.ProIndex === 0) {
                                    return <span style={{color: "black", marginLeft: "-10px"}}>{this.props.exp}</span>
                                }
                            })
                        }
                    </Col>
                </Row>
            </div>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {ProInfo: State.proInfo}
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
)(ProTag)