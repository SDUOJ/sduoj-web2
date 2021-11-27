import React, {Component, Dispatch} from 'react';
import {ExamState, SProInfo} from "../../Redux/Reducer/exam";
import {ChoiceContent, ProgramContent} from "../../Type/IProblem";
import {connect} from "react-redux";
// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";
import {Button, Space, Badge, DatePicker, Skeleton} from "antd";
import {GetMaxScore, getPoint, IsAnswer} from "../../Utils/Problem";
import SampleTestCase from "./SampleTestCase";


class Program extends Component<any> {


    componentDidMount() {
        VditorPreview.preview(
            document.getElementById("problem-content"),
            this.props.markdown
        )
    }


    render() {
        const ProgramHeader = (
            <div style={{textAlign: "center"}}>
                <Title level={2}>{this.props.title}</Title>
                <div>
                    <Space style={{fontSize: "16px"}} size={30}>
                        <div>
                            <span
                                style={{fontWeight: "bold"}}>{this.props.t("TimeLimit")}</span>: {this.props.TimeLimit} ms
                        </div>
                        <div>
                            <span
                                style={{fontWeight: "bold"}}>{this.props.t("MemoryLimit")}</span>: {this.props.MemoryLimit / 1024} MB
                        </div>
                    </Space>
                </div>
                <div style={{marginTop: "10px"}}>
                    <Space size={20}>
                        <Button type={"primary"}>提交</Button>
                        <Button type={"default"}>记录</Button>
                    </Space>
                </div>
            </div>
        )
        return (
            <>
                {
                    [''].map(() => {
                        {
                            if (this.props.IsAnswer) {
                                return (
                                    <Badge.Ribbon text={this.props.Score + this.props.t(getPoint(this.props.Score))}
                                                  color="red">
                                        {ProgramHeader}
                                    </Badge.Ribbon>
                                )
                            } else return ProgramHeader
                        }
                    })
                }
                <div id={"problem-content"} style={this.props.style}>
                    <Skeleton active/>
                </div>
                <SampleTestCase/>

            </>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowPro = (State.proInfo as SProInfo[])[State.TopProblemIndex - 1]
    const content = (NowPro.content as ProgramContent)
    return {
        markdown: content.markdown,
        title: content.title,
        TimeLimit: content.TimeLimit,
        MemoryLimit: content.MemoryLimit,
        Score: GetMaxScore(content),
        IsAnswer: IsAnswer(content)
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    updateChoice: () => dispatch({})
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(Program))