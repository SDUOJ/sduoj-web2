import {withRouter} from "react-router-dom";
import useExamInfo from "../../Component/exam/API/getExamInfo";
import {useDispatch, useSelector} from "react-redux";
import React, {useEffect, useState} from "react";
import eApi from "../../Utils/API/e-api";
import {getExamGroupListFunc} from "../../Component/exam/API/getExamGroupListFunc";
import {Button, Card, List, Modal, Result} from "antd";
import LoginCheck from "../../Component/common/LoginCheck";
import {getDescription} from "../../Component/exam/ExamUtils";
import Title from "antd/es/typography/Title";

import {ReactComponent as TIcon} from "Assert/img/True.svg"
import {ReactComponent as FIcon} from "Assert/img/False.svg"
import {ReactComponent as TFIcon} from "Assert/img/TF.svg"
import Icon from "@ant-design/icons";
import {isValueEmpty} from "../../Utils/empty";
import Choice from "../../Component/problem/Objective/Choice";
import CodeHighlight from "../../Component/common/CodeHighlight";
import ProProgram from "../../Component/problem/Program/ProProgram";

const EReport = (props: any) => {
    const eid = props.match.params.eid ?? props.eid

    const examInfo = useExamInfo(eid)
    const [examRes, setExamRes] = useState<any>()
    const [score, setScore] = useState<any>()
    const [myScore, setMyScore] = useState<any>()
    const [codeVis, setCodeVis] = useState<boolean>(false)
    const [objectVis, setObjectVis] = useState<boolean>(false)
    const [programVis, setProgramVis] = useState<boolean>(false)
    const [topInfo, setTopInfo] = useState<any[]>([eid, "", ""])
    const [proData, setProData] = useState<any>()

    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[eid]
    })
    const dispatch = useDispatch()

    useEffect(() => {
        if (problemList === undefined) {
            eApi.getExamGroupList(eid, true).then((res: any) => {
                getExamGroupListFunc(res, eid, dispatch, true)
            })
        } else {
            const rs: any = {}
            let sumScore = 0
            for (const x in problemList) {
                const y = problemList[x];
                let scoreX = 0
                for (const pro of y.proList) {
                    scoreX += pro.score;
                    rs[`${x}_${pro.index}`] = pro.score
                }
                rs[x] = scoreX
                sumScore += scoreX
            }
            rs['all'] = sumScore
            setScore(rs)
        }
    }, [problemList])

    useEffect(() => {
        if (examRes !== undefined) {
            const rs: any = {}
            let sumScore = 0
            for (const x of examRes.problemGroupResult) {
                let scoreX = 0
                for (const pro of x.problemResult[0]) {
                    scoreX += pro.realScore ?? pro.score;
                    rs[`${eid}_${x.groupIndex}_${pro.problemIndex}`] = pro.realScore ?? pro.score
                }
                rs[`${eid}_${x.groupIndex}`] = scoreX
                sumScore += scoreX
            }
            rs['all'] = sumScore
            setMyScore(rs)
        }
    }, [examRes])

    useEffect(() => {
        if (!isValueEmpty(topInfo[1])) {
            eApi.getProInfo({
                examId: topInfo[0],
                groupIndex: topInfo[1],
                problemIndex: topInfo[2]
            }, true).then((res: any) => {
                dispatch({
                    type: "setProblemInfo",
                    key: `EXAM_${topInfo[0]}_${topInfo[1]}_${topInfo[2]}`,
                    data: res
                })
                setProData(res)
            })
        }
    }, [topInfo[0], topInfo[1], topInfo[2]])

    useEffect(() => {
        if (examRes === undefined) {
            eApi.getExamResult(eid).then((res: any) => {
                setExamRes(res)
            })
        }
    }, [])


    return (
        <>
            <LoginCheck/>
            <div style={{textAlign: "center", margin: "0 auto"}}>
                <div style={{textAlign: "left", maxWidth: "800px", minWidth: "400px", margin: "0 auto"}}>
                    {props.eid === undefined && (
                        <Result
                            className={"Ewait"}
                            icon={<Title level={2}> 考试报告 </Title>}
                            title={examInfo?.title}
                            extra={
                                <div className={"Ewait-content"}>
                                    <Card
                                        className={"exam-wait-card"}
                                    >
                                        <Title level={4}> 学号： {examRes?.username}</Title>
                                        <Title level={4}> 姓名： {examRes?.nickname}</Title>
                                        <List
                                            size="small"
                                            dataSource={getDescription(examInfo).split('\n').filter((value: string) => value !== "")}
                                            renderItem={
                                                (item: string, index) => {
                                                    return (
                                                        <List.Item>{item}</List.Item>
                                                    )
                                                }
                                            }
                                        />
                                    </Card>
                                </div>
                            }
                        />
                    )}
                    <Modal
                        title={`题组${topInfo[1] + 1} - ${topInfo[2] + 1} 作答详情`}
                        visible={objectVis}
                        width={800}
                        onCancel={() => {
                            setObjectVis(false)
                        }}
                        footer={false}
                    >
                        {(() => {
                            if (proData !== undefined && objectVis) {
                                let answer;
                                for (let i = 0; i < examRes.problemGroupResult[topInfo[1]].problemResult[0].length; i++) {
                                    if (examRes.problemGroupResult[topInfo[1]].problemResult[0][i].problemIndex === topInfo[2]) {
                                        answer = examRes.problemGroupResult[topInfo[1]].problemResult[0][i]
                                    }
                                }
                                return <>
                                    <Choice
                                        answer={answer}
                                        description={proData.description}
                                        topInfo={topInfo}
                                    />
                                </>
                            }
                        })()}
                    </Modal>
                    <Modal
                        title={`题组${topInfo[1] + 1} - ${topInfo[2] + 1} 认定代码`}
                        visible={codeVis}
                        width={1000}
                        onCancel={() => {
                            setCodeVis(false)
                        }}
                        footer={false}
                    >
                        {examRes !== undefined && codeVis && (
                            <div style={{marginLeft: 36}}>
                                <CodeHighlight
                                    code={examRes.problemGroupResult[topInfo[1]].problemResult[0][topInfo[2]].code}
                                    lang={"cpp"}/>
                            </div>
                        )}
                    </Modal>
                    <Modal
                        title={`题组${topInfo[1] + 1} - ${topInfo[2] + 1} 题目详情`}
                        visible={programVis}
                        width={1300}
                        onCancel={() => {
                            setProgramVis(false)
                        }}
                        footer={false}
                    >
                        {(() => {
                            if (examInfo !== undefined && examRes !== undefined && programVis) {
                                const eid = topInfo[0], gid = topInfo[1], pid = topInfo[2]
                                return (
                                    <ProProgram
                                        showMdExport={false}
                                        nameWithD={`EXAM_${eid}_${gid}_${pid}`}
                                        name={`EXAM_${eid}_${gid}_${pid}`}
                                        GetProblemInfoAPI={eApi.getProInfo({
                                            examId: eid,
                                            groupIndex: gid,
                                            problemIndex: pid
                                        }, true)}
                                        SubmissionListAPI={async (data: any) => {
                                            return eApi.getSubmissionList({
                                                ...data,
                                                examId: parseInt(eid),
                                                problemGroup: parseInt(gid),
                                                problemIndex: parseInt(pid),
                                            }, true)
                                        }}
                                        QuerySubmissionAPI={async (submissionId: string) => {
                                            return eApi.getSubmission(eid, submissionId, true)
                                        }}
                                        scoreMod={examInfo.scoreMod}
                                        testcaseMod={examInfo.caseMod}
                                        showInfo={true}
                                        enableLeftSubmitCount={false}
                                    />
                                )
                            }
                        })()}
                    </Modal>
                    {
                        examRes !== undefined &&
                        problemList !== undefined &&
                        score !== undefined &&
                        myScore !== undefined && (
                            <>
                                {props.eid === undefined && (<>
                                    <Title level={4}> 总成绩： {myScore['all']} / {score['all']}</Title>
                                    <Title level={4}> 明细 </Title>
                                </>)}
                                {examRes.problemGroupResult.map((groupData: any) => {
                                    const title = problemList[`${eid}_${groupData.groupIndex}`].title
                                    const type = groupData.type
                                    const data: any = []
                                    for (const pro of groupData.problemResult[0]) {
                                        data.push({
                                            id: pro.problemIndex,
                                            score: pro.realScore ?? pro.score,
                                            orgScore: score[`${eid}_${groupData.groupIndex}_${pro.problemIndex}`],
                                            code: pro.code
                                        })
                                    }
                                    const groupName = `${eid}_${groupData.groupIndex}`
                                    return (
                                        <Card
                                            title={`题组${groupData.groupIndex + 1} - ${title} (${myScore[groupName]} / ${score[groupName]})`}
                                            bordered={false}>
                                            <List
                                                dataSource={data}
                                                size={"small"}
                                                renderItem={(item: any) => {
                                                    return (
                                                        <List.Item
                                                            key={item.id}
                                                            actions={(() => {
                                                                if (type === "SingleChoice" || type === "MultipleChoice") {
                                                                    return [
                                                                        <Button type={"link"} onClick={() => {
                                                                            setTopInfo([eid, groupData.groupIndex, item.id])
                                                                            setObjectVis(true)
                                                                        }}>详情</Button>,
                                                                    ]
                                                                }
                                                                if (type === "Program") {
                                                                    return [
                                                                        <Button type={"link"}
                                                                                onClick={() => {
                                                                                    setTopInfo([eid, groupData.groupIndex, item.id])
                                                                                    setCodeVis(true)
                                                                                }}
                                                                                disabled={isValueEmpty(item.code)}
                                                                        > 认定代码 </Button>,
                                                                        <Button type={"link"} onClick={() => {
                                                                            setTopInfo([eid, groupData.groupIndex, item.id])
                                                                            setProgramVis(true)
                                                                        }}>详情</Button>
                                                                    ]
                                                                }
                                                            })()}
                                                        >
                                                            <List.Item.Meta
                                                                avatar={(() => {
                                                                    if (item.score === 0)
                                                                        return <Icon component={FIcon}
                                                                                     style={{fontSize: 36}}/>
                                                                    else if (item.score === item.orgScore)
                                                                        return <Icon component={TIcon}
                                                                                     style={{fontSize: 36}}/>
                                                                    else return <Icon component={TFIcon}
                                                                                      style={{fontSize: 36}}/>
                                                                })()}
                                                                title={(item.id + 1)}
                                                                description={
                                                                    <>
                                                                        {item.score} / {item.orgScore}
                                                                    </>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )
                                                }}
                                            />
                                        </Card>
                                    )
                                })}
                            </>
                        )
                    }
                </div>
            </div>
        </>
    )
}

export default withRouter(EReport)