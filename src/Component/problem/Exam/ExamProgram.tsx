import React, {Component, Dispatch} from 'react';
import {Choice, IGetProInfo, ProblemState, ProContent, ProgramContent, TestCase} from "../../../Type/IProblem";
import {connect} from "react-redux";
import Title from "antd/lib/typography/Title";
import {withTranslation} from "react-i18next";
import {Badge, Button, Card, Modal, Skeleton, Space} from "antd";
import SampleTestCase from "../SampleTestCase";
import Submit from "../../submission/Submit";
import {withRouter} from "react-router-dom";
import eApi from "../../../Utils/API/e-api";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";


class ExamProgram extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ProcessingVis: false,
            recentSubmissionVis: false,
            proInfo: this.props.proInfo[this.props.proName]
        }
    }

    getProInfo = () => {
        this.props.getProInfo.then((res: any) => {
            let testCase: TestCase[] = []
            for (const x of res.problemCaseDTOList) {
                testCase.push({
                    "inputData": x.input,
                    "outputData": x.output
                })
            }
            let markdown = res.problemDescriptionDTO.markdownDescription
            const data = {
                title: res.problemTitle,
                markdown: markdown,
                testCase: testCase,
                TimeLimit: res.timeLimit,
                MemoryLimit: res.memoryLimit,
                JudgeTemplate: res.judgeTemplates,
                MaxSubmitNumber: res.submitNum,
                SumScore: res.sumScore
            }
            this.setState({proInfo: data})
            this.props.setProblemInfo(this.props.proName, data)

            // if (type === "SingleChoice" || type === "MultipleChoice") {
            //     let choice: Choice[] = []
            //     for (const x of Object.keys(resData.description.choice)) {
            //         choice.push({
            //             id: x,
            //             content: resData.description.choice[x],
            //             state: "init"
            //         })
            //     }
            //     data = {
            //         isLoad: true,
            //         content: resData.description.content,
            //         choice: choice
            //     }
            // }
        })
    }


    componentDidMount() {
        if (this.state.proInfo === undefined) this.getProInfo()
        else MarkdownPreview("problem-content", this.state.proInfo.markdown)
    }


    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot ?: any) {
        if (this.state.proInfo !== undefined && this.state.proInfo !== prevState.proInfo) {
            MarkdownPreview("problem-content", this.state.proInfo.markdown)
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
                <div>
                    <Space style={{fontSize: "16px"}} size={30}>
                        <div>
                            <span style={{fontWeight: "bold"}}>
                                评测模板
                            </span>
                            : C++11, C11, Java, Python
                        </div>
                        <div>
                            <span style={{fontWeight: "bold"}}>
                                来源
                            </span>
                            : 我是题目的来源 这个来源还是比较长的
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
                            {/*<RecentSubmission getSubmissionList={this.props.getSubmissionList}/>*/}
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
                {testCase !== undefined && testCase.length !== 0 && (
                    <Card bordered={false} title={this.props.t("SampleTestCase")} style={{marginTop: "20px"}}>
                        <SampleTestCase testCase={testCase}/>
                    </Card>
                )}
            </div>
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
)(
    withTranslation()(
        withRouter(ExamProgram)
    )
)