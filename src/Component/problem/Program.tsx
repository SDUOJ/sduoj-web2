import React, {Component, Dispatch} from 'react';
import {ChoiceContent, IGetProInfo, ProgramContent} from "../../Type/IProblem";
import {connect} from "react-redux";
// @ts-ignore
// import VditorPreview from 'vditor/dist/method.min'
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";
import {Button, Space, Badge, DatePicker, Skeleton, Card, Modal, Tooltip} from "antd";
import {GetMaxScore, getPoint, IsAnswer} from "../../Utils/Problem";
import SampleTestCase from "./SampleTestCase";
import {ExamState, SProGroupInfo, SProInfo} from "../../Type/IExam";
import Submit from "../submission/Submit";
import {withRouter} from "react-router-dom";
import {getProblemTodo} from "../../Redux/Action/exam";
import Processing from "../submission/Processing";
import RecentSubmission from "../submission/RecentSubmission";
import eApi from "../../Utils/API/e-api";
import {MarkdownPreview} from "../../Utils/MarkdownPreview";


class Program extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ProcessingVis: false,
            recentSubmissionVis: false
        }
    }

    componentDidMount() {
        MarkdownPreview("problem-content", this.props.markdown)
        if (this.props.Waiting === true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.GroupIndex - 1,
                problemIndex: this.props.ProIndex - 1
            })
        }
    }

    componentWillUpdate(nextProps: Readonly<any>, nextState: Readonly<any>, nextContext: any) {
        if (this.props.markdown != nextProps.markdown) {
            (document.getElementById("problem-content") as HTMLElement).innerHTML = "<Skeleton active/>"
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.markdown != prevProps.markdown) {
            MarkdownPreview("problem-content", this.props.markdown)
        }
        if (prevProps.Waiting == undefined && this.props.Waiting === true) {
            this.props.getProInfo({
                examId: this.props.match.params.eid,
                groupIndex: this.props.GroupIndex - 1,
                problemIndex: this.props.ProIndex - 1
            })
        }
    }

    getSubmissionList = (problemGroup: number, problemIndex: number) => {
        return eApi.getSubmissionList({
            examId: this.props.match.params.eid,
            problemGroup: problemGroup,
            problemIndex: problemIndex
        })
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
                    <Space size={25}>
                        <Badge count={
                            <Tooltip placement="topLeft" title={"剩余提交次数"}>
                                <span className={"Badge-Tooltip-Program"}>
                                    {this.props.LeftSubmitCount}
                                </span>
                            </Tooltip>
                        }>
                            <Submit LeftSubmitCount={this.props.LeftSubmitCount}/>
                        </Badge>
                        <Button
                            type={"default"}
                            onClick={() => {
                                this.setState({recentSubmissionVis: true})
                            }}
                        >
                            记录
                        </Button>
                        <Modal
                            width={1250}
                            visible={this.state.recentSubmissionVis}
                            footer={false}
                            onCancel={() => {
                                this.setState({recentSubmissionVis: false})
                            }}
                        >
                            <RecentSubmission pageSize={20} getSubmissionList={this.getSubmissionList}/>
                        </Modal>
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
                                    <Badge.Ribbon text={
                                        <>
                                            <span>当前得分：{this.props.Score / this.props.sumScore * 100 + "%"}</span>
                                        </>
                                    }
                                                  color={
                                                      [''].map(()=>{
                                                          if(this.props.Score === 0) return "red"
                                                          if(this.props.Score == this.props.sumScore) return "green"
                                                          return "orange"
                                                      })[0]
                                                  }>
                                        {ProgramHeader}
                                    </Badge.Ribbon>
                                )
                            } else return ProgramHeader
                        }
                    })
                }
                {/*title={this.props.t("Description")}*/}
                <Card bordered={false} style={{marginTop: "20px"}}>
                    <div id={"problem-content"} style={{overflow: "hidden"}}>
                        <Skeleton active/>
                    </div>
                </Card>
                {
                    this.props.testCase !== undefined && this.props.testCase.length !== 0 && (
                        <Card bordered={false} title={this.props.t("SampleTestCase")} style={{marginTop: "20px"}}>
                            <SampleTestCase/>
                        </Card>
                    )
                }
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    if (!State.ProListLoad) {
        return {Loading: !State.ProListLoad}
    } else {
        const NowPro = ((State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1].proList as SProInfo[])[State.TopProblemIndex - 1]
        if (NowPro.content == undefined || !NowPro.content.isLoad) {
            return {
                Loading: true,
                Waiting: true
            }
        } else {
            const content = (NowPro.content as ProgramContent)
            return {
                markdown: content.markdown,
                title: content.title,
                TimeLimit: content.TimeLimit,
                MemoryLimit: content.MemoryLimit,
                testCase: content.testCase,
                sumScore: content.SumScore,
                Score: GetMaxScore(content),
                IsAnswer: IsAnswer(content),
                LeftSubmitCount: content.MaxSubmitNumber as number - content.Submissions.length
            }
        }
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getProInfo: (data: IGetProInfo) => dispatch(getProblemTodo(data)),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(Program)))