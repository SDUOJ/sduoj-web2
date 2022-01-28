import React, {Component, Dispatch} from 'react';
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {connect} from "react-redux";
import {ChoiceContent, ChoiceState} from "../../../Type/IProblem";
import {ExamState, SProGroupInfo, SProInfo} from "../../../Type/IExam";
import {withRouter} from "react-router-dom";
import {examID} from "../../../Type/types";
// @ts-ignore
// import VditorPreview from 'vditor/dist/method.min'
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";

interface SOptions {
    choose: ChoiceState
}

class ExamOptions extends Component<any, SOptions> {
    constructor(props: any) {
        super(props);
        this.state = {
            choose: "init"
        }
        this.updateChooseUsed = this.updateChooseUsed.bind(this)
        this.updateChooseUnused = this.updateChooseUnused.bind(this)
    }

    componentDidMount() {
        let choice = this.props.choice
        for (let i = 0; i < choice.length; i++) {
            if (choice[i].id === this.props.ChoiceID) {
                if (choice[i].state !== this.props.choose) {
                    this.setState({
                        choose: choice[i].state
                    })
                }
                break;
            }
        }
        MarkdownPreview("Options-content-id" + this.props.ChoiceID, this.props.ChoiceContent)
    }

    // 在处理属性唯一的时候，根据 redux 的 props 更新当前的 state
    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<SOptions>, snapshot?: any) {
        let choice = this.props.choice
        for (let i = 0; i < choice.length; i++) {
            if (choice[i].id === prevProps.ChoiceID) {
                if (choice[i].state !== prevState.choose) {
                    this.setState({
                        choose: choice[i].state
                    })
                }
                break;
            }
        }
        if (this.props.ChoiceContent !== prevProps.ChoiceContent)
            MarkdownPreview("Options-content-id" + this.props.ChoiceID, this.props.ChoiceContent)
    }

    updateChooseUsed() {
        const eid = this.props.match.params.eid
        if (this.state.choose === "init" || this.state.choose === "unused") {
            this.setState({choose: "used"})
            this.props.updateChoice(eid, this.props.ChoiceID, "used")
        } else {
            this.setState({choose: "init"})
            this.props.updateChoice(eid, this.props.ChoiceID, "init")
        }
    }

    updateChooseUnused() {
        const eid = this.props.match.params.eid
        if (this.state.choose === "init" || this.state.choose === "used") {
            this.setState({choose: "unused"})
            this.props.updateChoice(eid, this.props.ChoiceID, "unused")
        } else {
            this.setState({choose: "init"})
            this.props.updateChoice(eid, this.props.ChoiceID, "init")
        }
    }

    render() {
        return (
            <div className={"Options-" + this.state.choose} onContextMenu={this.updateChooseUnused}
                 onClick={this.updateChooseUsed}>
                <Row>
                    <Col span={1}>
                        {
                            [''].map(() => {
                                if (this.state.choose === "used") return <CheckOutlined/>
                                if (this.state.choose === "unused") return <CloseOutlined/>
                            })
                        }
                    </Col>
                    <Col className={"Options-Choice"} span={1}>
                        {this.props.ChoiceID}.
                    </Col>
                    <Col className={"Options-content"} span={22}>
                        <div id={"Options-content-id" + this.props.ChoiceID}>

                        </div>
                    </Col>
                </Row>
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowGroup = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1];
    const NowPro = (NowGroup.proList as SProInfo[])[State.TopProblemIndex - 1]
    return {
        choice: (NowPro.content as ChoiceContent).choice
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    updateChoice: (eid: examID, ChoiceID: string, ChoiceState: ChoiceState) =>
        dispatch({
            type: "updateChoice",
            examId: eid,
            ChoiceID: ChoiceID,
            ChoiceState: ChoiceState
        })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamOptions))