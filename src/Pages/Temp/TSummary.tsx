import {Dispatch, useEffect, useState} from "react";
import {Button, Collapse, Image, Result, Space, Table} from "antd";
import logo from "Assert/img/sdu-logo.jpg"
import {withRouter} from "react-router-dom";
import {UrlPrefix} from "../../Config/constValue";
import Title from "antd/es/typography/Title";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {UserState} from "../../Type/Iuser";
import {testLoginTodo} from "../../Redux/Action/user";
import cApi from "Utils/API/c-api"
import eApi from "Utils/API/e-api"
import TextEllipsis from "../../Component/common/TextEllipsis";
import {unix2Time} from "../../Utils/Time";
import EReport from "../Exam/EReport";

const {Panel} = Collapse;


const TSummary = (props: any) => {

    const [data, setData] = useState<any>(undefined)
    const [dataExam, setDataExam] = useState<any>(undefined)
    const [score1, setScore1] = useState<number>(0)
    const [score2, setScore2] = useState<number>(0)
    const [score3, setScore3] = useState<number>(0)
    const [score4, setScore4] = useState<number>(0)
    const [score5, setScore5] = useState<number>(0)

    const getExam = async () => {
        const examIds = ["20", "22", "29", "19", "21", "24", "30", "31"]
        let examInfo: any = {}, examGroupInfo: any = {}, examResult: any = {}
        for (let examId of examIds) {
            await eApi.getExamInfo(examId).then((v1: any) => {
                examInfo[examId] = v1
                return eApi.getExamResult(examId).then((v3: any) => {
                    examResult[examId] = v3
                    return Promise.resolve()
                })
            })
        }
        setDataExam({
            examInfo: examInfo, examResult: examResult
        })
    }

    useEffect(() => {
        if (!props.isLogin) {
            props.history.replace(UrlPrefix + "/login?to=" + props.location.pathname)
        } else {
            const timeoutScoreRatio1 = [["0", 1.0], ["604800001", 0.9], ["1209600001", 0.8], ["12960000000", 0.7]];
            const timeoutScoreRatio2 = [["0", 0.85], ["604800001", 0.8], ["1209600001", 0.75], ["12960000000", 0.7]];

            cApi.getContestReport({
                contestList: [
                    {contestId: "144", title: "week1", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "146", title: "week2", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "148", title: "week3", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "151", title: "week4", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "153", title: "week5", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "156", title: "week6", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "157", title: "week7", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "160", title: "week8", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "162", title: "week9", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "166", title: "week10", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "169", title: "week11", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "172", title: "week12", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "175", title: "week13", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "177", title: "week14", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "180", title: "week15", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},

                    {contestId: "145", title: "Month3-T3", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "155", title: "Month4-T3", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "167", title: "Month5-T3", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},
                    {contestId: "176", title: "Month6-T3", weight: 1.25, timeoutScoreRatio: timeoutScoreRatio1},

                    {contestId: "152", title: "Exam-T3-1", weight: 1.5, timeoutScoreRatio: timeoutScoreRatio2},
                    {contestId: "163", title: "Exam-T3-2", weight: 1.5, timeoutScoreRatio: timeoutScoreRatio2},
                    {contestId: "174", title: "Exam-T3-3", weight: 1.5, timeoutScoreRatio: timeoutScoreRatio2},
                ]
            }).then((value) => {
                setData(value)
                // console.log(value)
            })
            getExam()
        }
    }, [])

    const hw = ["144", "146", "148", "151", "153", "156", "157", "160", "162", "166", "169", "172", "175", "177", "180"]
    const mt3 = ["145", "155", "167", "176"]

    const ext3 = [
        {contestId: "152", examId: "20"},
        {contestId: "163", examId: "22"},
        {contestId: "174", examId: "29"}
    ]

    const ext124 = ["19", "21", "24", "30"]


    return (
        <>
            <Result
                icon={<Image src={logo} width={"180px"} preview={false}/>}
                title="2022年程序设计思维与实践 SDUOJ 客观成绩汇总（89分）"
                subTitle={"以下成绩为未查重成绩，仅供参考，若有异常，请联系助教处理"}
            />
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{paddingBottom: 50, paddingTop: 50}}>
                    {(() => {
                        if (data !== undefined) {
                            let sum = score1 + score2 + score3 + score4 + score5
                            return (
                                <Title level={4}>客观成绩汇总（<span
                                    style={{color: "red"}}>{sum}分</span>/89分）</Title>
                            )
                        }
                    })()}
                </div>
                <div style={{textAlign: "left", maxWidth: "1200px", margin: "0 auto"}}>
                    <Collapse>
                        <Panel header={<>
                            {(() => {
                                if (data !== undefined) {
                                    let sum = 0
                                    hw.map((contestId: string) => {
                                        let d = data.filter((item: any) => item.contestId === contestId)[0]
                                        sum += d.sumScore / 100
                                    })
                                    if(sum !== score1) setScore1(sum)
                                    return (
                                        <Title level={3}>每周作业题（<span
                                            style={{color: "red"}}>{sum}分</span>/15分=1*15）</Title>
                                    )
                                }
                            })()}
                        </>} key="1">
                            {data !== undefined && hw.map((contestId: string) => {
                                let d = data.filter((item: any) => item.contestId === contestId)[0]
                                return (
                                    <>
                                        <Collapse>
                                            <Panel
                                                header={<>
                                                    <Space>
                                                        <Title level={5}>
                                                            {d.contestTitle} - {d.sumScore}/100
                                                            - {d.sumScore / 100}
                                                        </Title>
                                                        <Button
                                                            type={"primary"}
                                                            size={"small"}
                                                            style={{marginBottom: 10}}
                                                            onClick={() => {
                                                                props.history.push(UrlPrefix + `/contest/${contestId}`)
                                                            }}
                                                        >
                                                            跳转到比赛
                                                        </Button>
                                                    </Space>
                                                </>}
                                                key={`${contestId}`}
                                            >
                                                <Table
                                                    size={"small"}
                                                    columns={[
                                                        {
                                                            title: "题目名",
                                                            dataIndex: "problemTitle",
                                                            width: 100,
                                                            render: (text) => {
                                                                return <TextEllipsis text={text}/>
                                                            }
                                                        },
                                                        {title: "分数", dataIndex: "score"},
                                                        {title: "权重", dataIndex: "weight"},
                                                        {
                                                            title: "认定提交编号",
                                                            dataIndex: "submissionId",
                                                            render: (text: string) => {
                                                                if (text === "0") return "无有效提交"
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "提交时间",
                                                            dataIndex: "submitTime",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return unix2Time(text)
                                                            }
                                                        },
                                                        {
                                                            title: "延期折扣",
                                                            dataIndex: "timeoutRatio",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "代码查重",
                                                            dataIndex: "",
                                                            render: () => {
                                                                return "未查重"
                                                            }
                                                        },
                                                    ]}
                                                    dataSource={d.problemResults}
                                                />
                                            </Panel>
                                        </Collapse>
                                    </>
                                )
                            })}
                        </Panel>
                        <Panel header={<>
                            {(() => {
                                if (dataExam !== undefined) {
                                    let sum = 0
                                    ext124.map((value: string) => {
                                        let eResult = dataExam.examResult[value]
                                        sum += eResult.score / 400 * 5
                                    })
                                    if(sum !== score2) setScore2(sum)
                                    return (
                                        <Title level={3}>CSP模测（<span
                                            style={{color: "red"}}>{sum}分</span>/20分=4*5）</Title>
                                    )
                                }
                            })()}
                        </>} key="2">
                            {dataExam !== undefined && ext124.map((value: string) => {
                                const examId = value
                                let eInfo = dataExam.examInfo[examId]
                                let eResult = dataExam.examResult[examId]
                                return (
                                    <>
                                        <Collapse>
                                            <Panel
                                                header={<>
                                                    <Space>
                                                        <Title level={5}>
                                                            {eInfo.examTitle} - {eResult.score}/400
                                                            - {eResult.score / 400 * 5}
                                                        </Title>
                                                        <Button
                                                            type={"primary"}
                                                            size={"small"}
                                                            style={{marginBottom: 10}}
                                                            onClick={() => {
                                                                props.history.push(UrlPrefix + "/exam/report/" + examId)
                                                            }}
                                                        >
                                                            跳转到考试报告
                                                        </Button>
                                                    </Space>
                                                </>}
                                                key={`${examId}`}
                                            >
                                                <EReport eid={examId}/>
                                            </Panel>
                                        </Collapse>
                                    </>
                                )


                            })}
                        </Panel>
                        <Panel header={<>
                            {(() => {
                                if (data !== undefined) {
                                    let sum = 0
                                    mt3.map((contestId: string) => {
                                        let d = data.filter((item: any) => item.contestId === contestId)[0]
                                        sum += d.sumScore / 100 * 2
                                    })
                                    if(sum !== score3) setScore3(sum)
                                    return (
                                        <Title level={3}>每月T3练习（<span
                                            style={{color: "red"}}>{sum}分</span>/8分=2*4）</Title>
                                    )
                                }
                            })()}
                        </>} key="3">
                            {data !== undefined && mt3.map((contestId: string) => {
                                let d = data.filter((item: any) => item.contestId === contestId)[0]
                                return (
                                    <>
                                        <Collapse>
                                            <Panel
                                                header={<>
                                                    <Space>
                                                        <Title level={5}>
                                                            {d.contestTitle} - {d.sumScore}/100
                                                            - {d.sumScore / 100 * 2}
                                                        </Title>
                                                        <Button
                                                            type={"primary"}
                                                            size={"small"}
                                                            style={{marginBottom: 10}}
                                                            onClick={() => {
                                                                props.history.push(UrlPrefix + `/contest/${contestId}`)
                                                            }}
                                                        >
                                                            跳转到比赛
                                                        </Button>
                                                    </Space>
                                                </>}
                                                key={`${contestId}`}
                                            >
                                                <Table
                                                    size={"small"}
                                                    columns={[
                                                        {
                                                            title: "题目名",
                                                            dataIndex: "problemTitle",
                                                            width: 100,
                                                            render: (text) => {
                                                                return <TextEllipsis text={text}/>
                                                            }
                                                        },
                                                        {title: "分数", dataIndex: "score"},
                                                        {title: "权重", dataIndex: "weight"},
                                                        {
                                                            title: "认定提交编号",
                                                            dataIndex: "submissionId",
                                                            render: (text: string) => {
                                                                if (text === "0") return "无有效提交"
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "提交时间",
                                                            dataIndex: "submitTime",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return unix2Time(text)
                                                            }
                                                        },
                                                        {
                                                            title: "延期折扣",
                                                            dataIndex: "timeoutRatio",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "代码查重",
                                                            dataIndex: "",
                                                            render: () => {
                                                                return "未查重"
                                                            }
                                                        },
                                                    ]}
                                                    dataSource={d.problemResults}
                                                />
                                            </Panel>
                                        </Collapse>
                                    </>
                                )
                            })}
                        </Panel>
                        <Panel header={<>
                            {(() => {
                                if (data !== undefined && dataExam !== undefined) {
                                    let sum = 0
                                    ext3.map((item: any) => {
                                        const contestId = item.contestId
                                        const examId = item.examId
                                        let d = data.filter((item: any) => item.contestId === contestId)[0]
                                        let eResult = dataExam.examResult[examId]

                                        let ds: any = [], cnt = 0, sumScore = 0
                                        for (let x of d.problemResults) {
                                            let examScore = eResult.problemGroupResult[0].problemResult[0][cnt].realScore
                                            ds.push({
                                                ...x,
                                                examScore: examScore,
                                                finalScore: Math.max(examScore, x.score)
                                            })
                                            sumScore += Math.max(examScore, x.score)
                                            cnt++;
                                        }
                                        sum += sumScore / 100 * 2
                                    })
                                    if(sum !== score4) setScore4(sum)
                                    return (
                                        <Title level={3}>T3模测（<span
                                            style={{color: "red"}}>{sum}分</span>/6分=2*3）</Title>
                                    )
                                }
                            })()}
                        </>} key="4">
                            {data !== undefined && dataExam !== undefined && ext3.map((item: any) => {
                                const contestId = item.contestId
                                const examId = item.examId
                                let d = data.filter((item: any) => item.contestId === contestId)[0]
                                let eInfo = dataExam.examInfo[examId]
                                let eResult = dataExam.examResult[examId]

                                let ds: any = [], cnt = 0, sumScore = 0
                                for (let x of d.problemResults) {
                                    let examScore = eResult.problemGroupResult[0].problemResult[0][cnt].realScore
                                    ds.push({
                                        ...x,
                                        examScore: examScore,
                                        finalScore: Math.max(examScore, x.score)
                                    })
                                    sumScore += Math.max(examScore, x.score)
                                    cnt++;
                                }

                                return (
                                    <>
                                        <Collapse>
                                            <Panel
                                                header={<>
                                                    <Space>
                                                        <Title level={5}>
                                                            {eInfo.examTitle} - {sumScore}/100
                                                            - {sumScore / 100 * 2}
                                                        </Title>
                                                        <Button
                                                            type={"primary"}
                                                            size={"small"}
                                                            style={{marginBottom: 10}}
                                                            onClick={() => {
                                                                props.history.push(UrlPrefix + "/exam/report/" + examId)
                                                            }}
                                                        >
                                                            跳转到考试报告
                                                        </Button>
                                                        <Button
                                                            type={"primary"}
                                                            size={"small"}
                                                            style={{marginBottom: 10}}
                                                            onClick={() => {
                                                                props.history.push(UrlPrefix + "/contest/" + contestId)
                                                            }}
                                                        >
                                                            跳转到比赛
                                                        </Button>
                                                    </Space>
                                                </>}
                                                key={`${contestId}`}
                                            >
                                                <Table
                                                    size={"small"}
                                                    columns={[
                                                        {
                                                            title: "题目名",
                                                            dataIndex: "problemTitle",
                                                            width: 100,
                                                            render: (text) => {
                                                                return <TextEllipsis text={text}/>
                                                            }
                                                        },
                                                        {title: "最终分数", dataIndex: "finalScore"},
                                                        {title: "考场分数", dataIndex: "examScore"},
                                                        {title: "补题分数", dataIndex: "score"},
                                                        {
                                                            title: "补题认定提交编号",
                                                            dataIndex: "submissionId",
                                                            render: (text: string) => {
                                                                if (text === "0") return "无有效提交"
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "补题提交时间",
                                                            dataIndex: "submitTime",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return unix2Time(text)
                                                            }
                                                        },
                                                        {
                                                            title: "补题延期折扣",
                                                            dataIndex: "timeoutRatio",
                                                            render: (text: any, row: any) => {
                                                                if (row.submissionId === "0") return ""
                                                                return text
                                                            }
                                                        },
                                                        {
                                                            title: "补题代码查重",
                                                            dataIndex: "",
                                                            render: () => {
                                                                return "未查重"
                                                            }
                                                        },
                                                    ]}
                                                    dataSource={ds}
                                                />
                                            </Panel>
                                        </Collapse>
                                    </>
                                )
                            })}
                        </Panel>
                        <Panel header={<>
                            {(() => {
                                if (dataExam !== undefined) {
                                    let eResult = dataExam.examResult["31"]
                                    let sum = eResult.score / 10

                                    if(sum !== score5) setScore5(sum)
                                    return (
                                        <Title level={3}>期末考试（<span
                                            style={{color: "red"}}>{sum}分</span>/40分）</Title>
                                    )
                                }
                            })()}
                        </>} key="5">
                            只显示分数
                        </Panel>
                    </Collapse>
                </div>
                <div style={{paddingBottom: 100, paddingTop: 100}}>
                    <Title level={4}>非客观成绩说明（11分）</Title>
                    <Title level={5}>考勤（3分）</Title>
                    满分：线上上课，线下实验，所有考勤中，缺勤（包括请假但没有提交假条）3次（包含）以内<br/>
                    缺勤超过3次，超出的每次扣除0.5分考勤成绩，扣完为止<br/><br/>
                    <Title level={5}>实验报告（8分）</Title>
                    根据书写内容，由助教进行打分，每次报告分值比例会根据当次报告的内容进行调整，满分 8 分<br/>
                </div>
            </div>
        </>
    );

}

const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin,
        userInfo: UState.userInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    testLogin: () => dispatch(testLoginTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(TSummary)
    )
)