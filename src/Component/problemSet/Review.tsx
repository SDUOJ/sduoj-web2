import {Button, Card, Col, Form, Input, message, Modal, Row, Select, Space} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import "Assert/css/Review.css"
import ScoreMode from "../subjectiveProblem/ScoreMode";
import TableWithPagination from "../common/Table/TableWithPagination";
import cApi from "../../Utils/API/c-api";
import {unix2Time} from "../../Utils/Time";
import useProblemSetInfo from "./API/getProblemSetInfo";
import {isValueEmpty} from "../../Utils/empty";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../../Type/Iuser";
import SubjectivePreview from "./SubjectivePreview";
import SwitchX from "../common/Form/Item/SwitchX";


const Review = (props: any) => {
    const psid = parseInt(props.match.params.problemSetId)
    const problemSetInfo = useProblemSetInfo(psid.toString())

    // 打分数据
    const [reviewInfo, setReviewInfo] = useState<any>({});
    const [judgeInfo, setJudgeInfo] = useState<any>({});
    const [judgeComment, setJudgeComment] = useState<any>();
    const [vis, setVis] = useState<any>(false);
    const [autoNext, setAutoNext] = useState<number>(0);
    const [clickSubmit, setClickSubmit] = useState<boolean>(false);


    useEffect(() => {
        if (vis === false) {
            setReviewInfo({})
            setJudgeInfo({})
        }
    }, [psid, vis])

    // console.log("review", reviewInfo)

    // const scoreModeInfo = {
    //     score: 100,
    //     children: [
    //         {
    //             key: "1",
    //             title: "问答题",
    //             score: 20,
    //             answer: "时间复杂度为: $O(n)$, $O(n^2)$",
    //             info: [
    //                 [20, "答案正确，解释充分"],
    //                 [15, "答案正确，解释不充分"],
    //                 [5, "答案错误，解释部分正确"],
    //                 [0, "答案错误"]
    //             ]
    //         },
    //         {
    //             key: "2",
    //             title: "实验报告",
    //             score: 80,
    //             children: [
    //                 {
    //                     key: "2-1",
    //                     title: "T1",
    //                     score: 40,
    //                     children: [
    //                         {key: "2-1-1", title: "题目分析", score: 10, quick: true},
    //                         {key: "2-1-2", title: "时间复杂度", score: 10, quick: true},
    //                         {key: "2-1-3", title: "代码", score: 10, quick: true},
    //                         {
    //                             key: "2-1-4",
    //                             title: "代码注释", score: 10, info: [
    //                                 [10, "注释3个以上，且充分"],
    //                                 [5, "存在有效注释"],
    //                                 [0, "无注释"]
    //                             ]
    //                         },
    //                     ]
    //                 },
    //                 {
    //                     key: "2-2",
    //                     title: "T2",
    //                     score: 40,
    //                     children: [
    //                         {key: "2-2-1", title: "题目分析", score: 10, quick: true},
    //                         {key: "2-2-2", title: "时间复杂度", score: 10, quick: true},
    //                         {key: "2-2-3", title: "代码", score: 10, quick: true},
    //                         {
    //                             key: "2-2-4",
    //                             title: "代码注释", score: 10, info: [
    //                                 [10, "注释3个以上，且充分"],
    //                                 [5, "存在有效注释"],
    //                                 [0, "无注释"]
    //                             ]
    //                         },
    //                     ]
    //                 }
    //             ]
    //         }
    //     ]
    // }

    const options: any = []
    if (problemSetInfo !== undefined) {
        for (let x of problemSetInfo.groupInfo) {
            if (x.type === 1) {
                for (let y of x.problemInfo) {
                    options.push({value: `${x.index}-${y.index}`, label: x.name + "-" + (y.index + 1).toString()})
                }
            }
        }
    }

    const start_review = (rows: any) => {
        cApi.getJudgeInfo({
            psid: psid, gid: rows.gid, pid: rows.pid, username: rows.username
        }).then((res: any) => {
            for (let i = 0; i < res.judgeConfig.length; i++) {
                const x = res.judgeConfig[i]
                x.title = x.name
                x.key = (i + 1).toString()
            }
            res.judgeConfig = {
                key: "0",
                score: 100,
                children: res.judgeConfig
            }
            res.pid = rows.pid
            res.gid = rows.gid
            if (!isValueEmpty(res.judgeLog)) {
                let sum = 0
                let rs: any = {}
                for (let i = 0; i < res.judgeLog.length; i++) {
                    let x = res.judgeLog[i]
                    rs[(i + 1).toString()] = x.jScore
                    sum += x.jScore
                }
                rs["0"] = sum
                setReviewInfo(rs)
            }
            // console.log(res)
            setJudgeInfo(res)
            setJudgeComment(res.judgeComment)
            setVis(true)
        })
    }

    return (
        <div style={{marginTop: 24}} className={"ListPage"}>
            <TableWithPagination
                name={"problemSetSubjectiveJudgeList"}
                columns={[
                    {title: "题目名", dataIndex: "name", key: "name"},
                    {title: "用户名", dataIndex: "username", key: "username"},
                    {
                        title: "提交时间",
                        dataIndex: "tm_answer_submit",
                        key: "tm_answer_submit",
                        render: (text: any) => {
                            return unix2Time(text)
                        }
                    },
                    {
                        title: "批阅状态",
                        dataIndex: "hasJudge",
                        key: "hasJudge",
                        render: (text: any) => {
                            if (text) return "已批阅"
                            else return "未批阅"
                        }
                    },
                    {title: "批阅人", dataIndex: "judgeLock", key: "judgeLock"},
                    {
                        title: "操作", key: "operator", render: (rows: any) => {
                            return (
                                <Button type={"link"} onClick={() => {
                                    start_review(rows)
                                }}>开始打分</Button>
                            )
                        }
                    }
                ]}
                API={(data: any) => {
                    return cApi.getJudgeList({psid: psid, ...data}).then((res: any) => {
                        if (autoNext === 1 && res.rows.length !== 0 && clickSubmit) {
                            for (let i = 0; i < res.rows.length; i++) {
                                if (!res.rows[i].hasJudge) {
                                    start_review(res.rows[i])
                                    break
                                }
                            }
                        }
                        setClickSubmit(false)
                        return Promise.resolve(res)
                    })
                }}
                size={"small"}
                getForm={(onFinish: any) => {
                    return (
                        <Space size={30}>
                            <Form.Item label={"用户名"} name={"username"}>
                                <Input onPressEnter={() => {
                                    onFinish()
                                }}/>
                            </Form.Item>
                            <Form.Item label={"批阅人"} name={"judgeLock"}>
                                <Input onPressEnter={() => {
                                    onFinish()
                                }}/>
                            </Form.Item>
                            <Form.Item label={"批阅状态"} name={"hasJudge"}>
                                <Select onChange={onFinish} style={{width: 120}} allowClear
                                        options={[{value: 0, label: "未批阅"}, {value: 1, label: "已批阅"}]}/>
                            </Form.Item>
                            <Form.Item label={"题目"} name={"proStr"}>
                                <Select onChange={onFinish} style={{width: 240}} allowClear options={options}/>
                            </Form.Item>
                        </Space>
                    )
                }}
                useFormBtn={false}
            />
            <div style={{marginTop: 12, float: "right"}}>
                <span>提示：如果对主观题进行了批阅，会导致学生无法再次提交，请确定作答完成后再进行批阅</span>
            </div>

            <Modal
                title={"主观题评分"}
                width={1400}
                visible={vis}
                maskClosable={false}
                onCancel={() => {
                    setVis(false)
                    props.addTableVersion("problemSetSubjectiveJudgeList")
                }}
                footer={false}
                destroyOnClose={true}
            >
                <Row gutter={24}>
                    <Col span={14}>
                        <SubjectivePreview
                            description={judgeInfo?.description}
                            answer={judgeInfo?.answer}
                        />
                    </Col>
                    <Col span={10}>
                        <Card className={"scorePane"} title={"分数面板"}>
                            <div>
                                <ScoreMode
                                    reviewInfo={reviewInfo}
                                    setReviewInfo={setReviewInfo}
                                    scoreModeInfo={judgeInfo.judgeConfig}
                                />
                                <Form layout={"vertical"} style={{marginBottom: 32}}>
                                    <Form.Item label={"评阅备注"}>
                                        <Input.TextArea value={judgeComment} onChange={(e) => {
                                            setJudgeComment(e.target.value)
                                        }}/>
                                    </Form.Item>
                                </Form>
                                <div style={{marginTop: 12, marginBottom: 12}}>
                                    <Form.Item label={"自动打开下一个"}>
                                        <SwitchX value={autoNext} onChange={setAutoNext} ck={"Auto Next"}
                                                 unck={"Manual Next"}/>
                                    </Form.Item>
                                </div>
                                <Button disabled={judgeInfo.judgeLock_username !== props.username} block={true}
                                        type="primary" onClick={() => {
                                    if (Object.keys(reviewInfo).length < judgeInfo.judgeConfig.children.length + 1) {
                                        message.error("分数不完整")
                                        return
                                    }
                                    let res = []
                                    for (let i = 0; i < judgeInfo.judgeConfig.children.length; i++) {
                                        let x = judgeInfo.judgeConfig.children[i]
                                        res.push({name: x.name, score: x.score, jScore: reviewInfo[i + 1]})
                                    }
                                    cApi.updateJudgeInfo({
                                        psid: psid,
                                        gid: judgeInfo.gid,
                                        pid: judgeInfo.pid,
                                        username: judgeInfo.username,
                                        judgeLog: res,
                                        judgeComment: judgeComment
                                    }).then(() => {
                                        setClickSubmit(true)
                                        setVis(false)
                                        props.addTableVersion("problemSetSubjectiveJudgeList")
                                    })
                                }}> 提交分数 </Button>
                                <Button
                                    disabled={
                                        judgeInfo.judgeLock_username !== props.username ||
                                        Object.keys(reviewInfo).length !== 0
                                    } block={true} style={{marginTop: 12}}
                                    type="ghost" danger={true} onClick={() => {
                                    let res = []
                                    for (let i = 0; i < judgeInfo.judgeConfig.children.length; i++) {
                                        let x = judgeInfo.judgeConfig.children[i]
                                        res.push({name: x.name, score: x.score, jScore: x.score})
                                    }
                                    cApi.updateJudgeInfo({
                                        psid: psid,
                                        gid: judgeInfo.gid,
                                        pid: judgeInfo.pid,
                                        username: judgeInfo.username,
                                        judgeLog: res,
                                        judgeComment: judgeComment
                                    }).then(() => {
                                        setClickSubmit(true)
                                        setVis(false)
                                        props.addTableVersion("problemSetSubjectiveJudgeList")
                                    })
                                }}>
                                    设为<span style={{fontWeight: "bolder"}}>满分</span>并提交分数
                                </Button>
                                {judgeInfo.judgeLock_username === props.username && (
                                    <Button danger block type={"primary"} style={{marginTop: 12}} onClick={() => {
                                        cApi.updateJudgeInfo({
                                            psid: psid,
                                            gid: judgeInfo.gid,
                                            pid: judgeInfo.pid,
                                            username: judgeInfo.username,
                                            judgeLog: [],
                                            cancel: 1
                                        }).then(() => {
                                            setVis(false)
                                            props.addTableVersion("problemSetSubjectiveJudgeList")
                                        })
                                    }}>取消评测</Button>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Modal>
        </div>
    )
}


const mapStateToProps = (state: any) => {
    const UState: UserState = state.UserReducer
    return {
        username: UState.userInfo?.username
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    addTableVersion: (name: string) => dispatch({type: "addTableVersion", name: name}),
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(
        withRouter(Review)
    )
);
