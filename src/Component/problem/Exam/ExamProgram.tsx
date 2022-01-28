import React, {Component, Dispatch} from 'react';
import {IGetProInfo, ProgramContent} from "../../../Type/IProblem";
import {connect} from "react-redux";
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";
import {Badge, Button, Card, Modal, Skeleton, Space} from "antd";
import {GetMaxScore, IsAnswer} from "../../../Utils/Problem";
import SampleTestCase from "../SampleTestCase";
import {ExamState, SProGroupInfo, SProInfo} from "../../../Type/IExam";
import Submit from "../../submission/Submit";
import {withRouter} from "react-router-dom";
import {getProblemTodo} from "../../../Redux/Action/exam";
import RecentSubmission from "../../submission/RecentSubmission";
import eApi from "../../../Utils/API/e-api";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";


class ExamProgram extends Component<any, any> {


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


    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (this.props.markdown !== prevProps.markdown) {
            MarkdownPreview("problem-content", this.props.markdown)
        }
        if (prevProps.Waiting === undefined && this.props.Waiting === true) {
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

    getColor = (nowScore: number, sumScore: number) => {
        if (nowScore === 0) return "red"
        if (nowScore === sumScore) return "green"
        return "orange"
    }

    render() {
        const ProgramHeader = (
            <div style={{textAlign: "center"}}>
                <Title level={2}>{this.props.title}</Title>
                <div>
                    <Space style={{fontSize: "16px"}} size={30}>
                        <div>
                            <span style={{fontWeight: "bold"}}>
                                {this.props.t("TimeLimit")}
                            </span>
                            : {this.props.TimeLimit} ms
                        </div>
                        <div>
                            <span style={{fontWeight: "bold"}}>
                                {this.props.t("MemoryLimit")}
                            </span>
                            : {this.props.MemoryLimit / 1024} MB
                        </div>
                    </Space>
                </div>
                <div style={{marginTop: "10px"}}>
                    <Space size={25}>
                        <Submit
                            API={eApi.CreateSubmit}
                            data={{
                                problemCode: this.props.ProblemCode,
                                problemIndex: parseInt(this.props.ProblemCode),
                                groupIndex: this.props.groupId,
                                examId: this.props.match.params.eid
                            }}
                            title={this.props.title}
                            LeftSubmitCount={this.props.LeftSubmitCount}
                            TopSubmissionInfo={{
                                title: this.props.title,
                                TimeLimit: this.props.TimeLimit,
                                MemoryLimit: this.props.MemoryLimit,
                                sumScore: this.props.sumScore,
                                showScore: this.props.isSubmissionScoreVisible
                            }}
                            JudgeTemplates={this.props.JudgeTemplates}
                        />

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
        const testCase = this.props.testCase
        return (
            <div className={"Problem-Program"}>
                {[''].map(() => {
                    // 对于以作答的题目，当分数不为 0 的时候，或默认显示分数的时显示提示
                    if (this.props.IsAnswer && (this.props.Score !== 0 || this.props.isSubmissionScoreVisible === true)) {
                        if (this.props.isSubmissionScoreVisible === true) {
                            return (
                                <Badge.Ribbon
                                    text={
                                        <span>当前得分：{this.props.Score / this.props.sumScore * 100 + "%"}</span>
                                    }
                                    color={this.getColor(this.props.Score, this.props.sumScore)}>
                                    {ProgramHeader}
                                </Badge.Ribbon>
                            )
                        } else if (this.props.isSubmissionScoreVisible === false && this.props.Score !== 0) {
                            return (
                                <Badge.Ribbon
                                    text={
                                        <span>
                                            {this.props.Score !== this.props.sumScore && ("部分通过")}
                                            {this.props.Score === this.props.sumScore && ("全部通过")}
                                        </span>
                                    }
                                    color={this.getColor(this.props.Score, this.props.sumScore)}>
                                    {ProgramHeader}
                                </Badge.Ribbon>
                            )
                        }
                    } else return ProgramHeader
                })}
                {/*题目主干*/}
                <Card bordered={false} style={{marginTop: "20px"}}>
                    <div id={"problem-content"} style={{overflow: "hidden"}}>
                    </div>
                </Card>
                {/*测试用例*/}
                {
                    testCase !== undefined && testCase.length !== 0 && (
                        <Card bordered={false} title={this.props.t("SampleTestCase")} style={{marginTop: "20px"}}>
                            <SampleTestCase testCase={testCase}/>
                        </Card>
                    )
                }
            </div>
        )
    }
}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    if (State.ProListLoad) {
        const NowPro = ((State.proGroupInfo as SProGroupInfo[])[State.TopGroupIndex - 1].proList as SProInfo[])[State.TopProblemIndex - 1]
        if (NowPro.content === undefined || !NowPro.content.isLoad) {
            return {
                Loading: true,
                Waiting: true
            }
        } else {
            const content = (NowPro.content as ProgramContent)
            return {
                ProblemCode: State.TopProblemIndex - 1,
                groupId: State.TopGroupIndex - 1,
                JudgeTemplates: content.JudgeTemplate,

                markdown: content.markdown,
                title: content.title,

                TimeLimit: content.TimeLimit,
                MemoryLimit: content.MemoryLimit,
                sumScore: content.SumScore,
                isSubmissionScoreVisible: State.examInfo?.isSubmissionScoreVisible,

                testCase: content.testCase,
                Score: GetMaxScore(content),
                IsAnswer: IsAnswer(content),
                LeftSubmitCount: content.MaxSubmitNumber as number - content.Submissions.length,

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
)(
    withTranslation()(
        withRouter(ExamProgram)
    )
)