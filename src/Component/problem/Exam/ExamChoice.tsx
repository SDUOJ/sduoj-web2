import React, {Component, Dispatch} from 'react';
import {Skeleton} from "antd";
import Options from "./ExamOptions";
import {connect} from "react-redux";
import {ChoiceContent, IGetProInfo, ProblemState, ProContent} from "../../../Type/IProblem";
import {ExamState, SProInfo} from "../../../Type/IExam";
import {withRouter} from "react-router-dom";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";


class ExamChoice extends Component<any, any> {

    componentDidMount() {
        if (this.props.Waiting === true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.match.params.gid,
                problemIndex: this.props.match.params.pid
            })
        }
        if (!this.props.Loading) {
            MarkdownPreview("Choice-title-id", this.props.content)
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.Waiting === undefined && this.props.Waiting === true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.match.params.gid,
                problemIndex: this.props.match.params.pid
            })
        }
        if (!this.props.Loading) {
            if (prevProps.content !== this.props.content)
                MarkdownPreview("Choice-title-id", this.props.content)
        }
    }

    render() {
        return (
            <Skeleton active loading={this.props.Loading}>
                <div className={"Choice"}>
                    <div className={"Choice-title"} id={"Choice-title-id"}>

                    </div>
                    {
                        this.props.choice !== undefined && (
                            this.props.choice.map((val: any) => {
                                return (
                                    <Options
                                        ChoiceID={val.id}
                                        ChoiceContent={val.content}
                                    />
                                )
                            })
                        )
                    }
                </div>
            </Skeleton>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ProblemState = state.ProblemReducer
    return {
        proInfo: State.ProblemInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    setProblemInfo: (key: string, data: ProContent) => dispatch({
        type: "setProblemInfo", key: key, data: data
    }),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(ExamChoice))