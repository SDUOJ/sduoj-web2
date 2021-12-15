import React, {Component, Dispatch} from 'react';
import {ChoiceContent, ProgramContent} from "../../Type/IProblem";
import {connect} from "react-redux";
// @ts-ignore
import VditorPreview from 'vditor/dist/method.min'
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";
import {Button, Space, Badge, DatePicker, Skeleton, Card} from "antd";
import {GetMaxScore, getPoint, IsAnswer} from "../../Utils/Problem";
import SampleTestCase from "./SampleTestCase";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";
import Submit from "../submission/Submit";


class Program extends Component<any, any> {


    componentDidMount() {
        VditorPreview.preview(
            document.getElementById("problem-content"),
            this.props.markdown
        )
    }

    componentWillUpdate(nextProps: Readonly<any>, nextState: Readonly<any>, nextContext: any) {
        if (this.props.markdown != nextProps.markdown) {
            (document.getElementById("problem-content") as HTMLElement).innerHTML = "<Skeleton active/>"
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.markdown != prevProps.markdown) {
            VditorPreview.preview(
                document.getElementById("problem-content"),
                this.props.markdown
            )
        }
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
                        <Submit/>
                        <Button type={"default"}>记录</Button>
                    </Space>
                </div>
            </div>
        )
        return (
            <div className={"Problem-Program"}>
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
                <Card title={this.props.t("Description")} style={{marginTop:"20px"}}>
                    <div id={"problem-content"}>
                        <Skeleton active/>
                    </div>
                </Card>
                <Card title={this.props.t("SampleTestCase")} style={{marginTop:"20px"}}>
                    <SampleTestCase/>
                </Card>
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const NowGroup = (State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1];
    const NowPro = (NowGroup.proList as SProInfo[])[State.TopProblemIndex - 1]
    const content = (NowPro.content as ProgramContent)
    return {
        markdown: content.markdown,
        title: content.title,
        TimeLimit: content.TimeLimit,
        MemoryLimit: content.MemoryLimit,
        Score: GetMaxScore(content),
        IsAnswer: IsAnswer(content),
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(Program))