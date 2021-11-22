import React, {Component, Dispatch} from 'react';
import {Skeleton} from "antd";
import Options from "./Options";
import {ExamState, SProInfo} from "../../Redux/Reducer/exam";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent} from "../../Type/IProblem";


class Choice extends Component<any, any> {
    render() {
        return (
            <Skeleton active loading={this.props.Loading}>
                <div className={"Choice"}>
                    <div className={"Choice-title"}>{this.props.content}</div>
                    {
                        this.props.choice.map((val: any) => {
                            return (
                                <Options
                                    ChoiceID={val.id}
                                    ChoiceContent={val.content}
                                />
                            )
                        })
                    }
                </div>
            </Skeleton>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    if (!State.ProListLoad) {
        return {Loading: !State.ProListLoad}
    } else {
        const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
        return {
            Loading: !State.ProListLoad,
            content: (NowPro.content as ChoiceContent).content,
            choice: (NowPro.content as ChoiceContent).choice
        }
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(Choice)