import React, {Component, Dispatch} from 'react';
import {Skeleton} from "antd";
import Options from "./Options";
import {ExamAction, getProblemTodo} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ChoiceContent, IGetProInfo} from "../../Type/IProblem";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";
import {withRouter} from "react-router-dom";


class Choice extends Component<any, any> {

    componentDidMount() {
        if (this.props.Waiting == true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.GroupIndex - 1,
                problemIndex: this.props.ProIndex - 1
            })
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.Waiting == true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.GroupIndex - 1,
                problemIndex: this.props.ProIndex - 1
            })
        }
    }

    render() {
        return (
            <Skeleton active loading={this.props.Loading}>
                <div className={"Choice"}>
                    <div className={"Choice-title"}>{this.props.content}</div>
                    {
                        this.props.choice != undefined && (
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
    const State: ExamState = state.ExamReducer
    if (!State.ProListLoad) {
        return {Loading: !State.ProListLoad}
    } else {
        const NowPro = ((State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1].proList as SProInfo[])[State.TopProblemIndex - 1]
        console.log("Choice", NowPro.content)
        if (NowPro.content == undefined || !NowPro.content.isLoad) {
            return {
                Loading: true,
                Waiting: true
            }
        } else {
            return {
                Loading: !State.ProListLoad,
                content: (NowPro.content as ChoiceContent).content,
                choice: (NowPro.content as ChoiceContent).choice
            }
        }
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getProInfo: (data: IGetProInfo) => dispatch(getProblemTodo(data))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withRouter(Choice))