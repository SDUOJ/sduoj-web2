import React, {Component, Dispatch} from 'react';
import {Card, Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent, ChoiceState} from "../../Type/IProblem";
import {ExamState, SProInfo} from "../../Type/IExam";


interface SOptions {
    choose: ChoiceState
}

class Options extends Component<any, SOptions> {
    constructor(props: any) {
        super(props);
        this.state = {
            choose: "init"
        }
        this.updateChooseUsed = this.updateChooseUsed.bind(this)
        this.updateChooseUnused = this.updateChooseUnused.bind(this)
    }

    // 在处理属性唯一的时候，根据 redux 的 props 更新当前的 state
    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<SOptions>, snapshot?: any) {
        let choice = this.props.choice
        for(let i = 0; i < choice.length; i ++){
            if(choice[i].id == prevProps.ChoiceID){
                if(choice[i].state != prevState.choose){
                    this.setState({
                        choose: choice[i].state
                    })
                }
                break;
            }
        }
    }

    updateChooseUsed() {
        if (this.state.choose === "init" || this.state.choose === "unused") {
            this.setState({choose: "used"})
            this.props.updateChoice(this.props.ChoiceID, "used")
        } else {
            this.setState({choose: "init"})
            this.props.updateChoice(this.props.ChoiceID, "init")
        }
    }

    updateChooseUnused() {
        if (this.state.choose === "init" || this.state.choose === "used") {
            this.setState({choose: "unused"})
            this.props.updateChoice(this.props.ChoiceID, "unused")
        } else {
            this.setState({choose: "init"})
            this.props.updateChoice(this.props.ChoiceID, "init")
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
                        {this.props.ChoiceContent}
                    </Col>
                </Row>
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
    return {
        choice: (NowPro.content as ChoiceContent).choice
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    updateChoice: (ChoiceID: string, ChoiceState: ChoiceState) => dispatch({
        type: "updateChoice",
        ChoiceID: ChoiceID,
        ChoiceState: ChoiceState
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Options)