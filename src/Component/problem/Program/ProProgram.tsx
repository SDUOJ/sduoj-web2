import {WithTranslation, withTranslation} from "react-i18next";
import {Card, Space} from "antd";
import Submit from "../../submission/Submit";
import React, {Dispatch, useEffect, useState} from "react";
import {JudgeTemplateAllType, ProblemState} from "../../../Type/IProblem";
import SampleTestCase from "../SampleTestCase";
import {displayType} from "../../../Type/ISubmission";
import ModalSubmissionList from "../../submission/SubmissionList/ModalSubmissionList";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";
import {connect} from "react-redux";
import {UserState} from "../../../Type/Iuser";
import {isValueEmpty} from "../../../Utils/empty";
import {TableState} from "../../../Type/ITable";
import MD2export from "../../common/Md2export";

interface ProProgramProps {
    // problemTitle: string       // 题目标题
    // problemCode: string
    // timeLimit: number
    // memoryLimit: number
    // source: string
    // judgeTemplates: JudgeTemplateAllType[]
    // testCase: TestCase[]

    nameWithD: string   // 带有描述的题目名
    name: string
    GetProblemInfoAPI: any
    SubmitAPI?: any
    SubmissionListAPI: any
    QuerySubmissionAPI: any
    LeftSubmitCount?: number

    scoreMod: displayType
    testcaseMod: displayType

    tableData: any      // 表格数据
    isLogin: boolean
    showInfo: boolean   // 是否展示题目详情
    enableLeftSubmitCount?: boolean

    ProblemInfo: any // 题目信息
    showMdExport: boolean
}

export const getJudgeStr = (judgeTemplates: JudgeTemplateAllType[]) => {
    if (judgeTemplates === undefined) return ""
    let res = "", cnt = 0
    for (const x of judgeTemplates) {
        if (cnt !== 0) res += ", "
        res += x.title
        cnt += 1
    }
    return res
}

const ProProgram = (props: ProProgramProps & WithTranslation) => {

    const [markdownDescription, setMarkdownDescription] = useState()
    const problemInfo = props.ProblemInfo[props.nameWithD]

    useEffect(() => {
        if (problemInfo !== undefined && problemInfo.problemDescriptionDTO !== null) {
            MarkdownPreview("problem-content", problemInfo.problemDescriptionDTO.markdownDescription)
            setMarkdownDescription(problemInfo.problemDescriptionDTO.markdownDescription)
        }
    }, [problemInfo])

    let ps = ["", ""]
    if (problemInfo !== undefined && !isValueEmpty(problemInfo?.problemCode))
        ps = problemInfo?.problemCode.split("-")

    const [totalSubmission, setTotalSubmission] = useState<number>(0)

    useEffect(() => {
        if (props.tableData !== undefined) {
            const tableData = props.tableData["Pro-SubmissionList-Recent-" + props.name]
            // console.log("tableData", tableData)
            // console.log("tableData?.tableInfo?.total ?? 0", tableData?.tableInfo?.total ?? 0)
            setTotalSubmission(tableData?.tableInfo?.total ?? 0)
        }
    }, [props.tableData])

    const ProgramHeader = (
        <div style={{textAlign: "center"}}>
            <div style={{fontSize: "26px", marginBottom: "20px", marginTop: "10px"}}>
                {[""].map(() => {
                    if (!isValueEmpty(problemInfo?.problemCode) && problemInfo.problemCode.indexOf("-") !== -1)
                        return (
                            <>
                                <span style={{fontWeight: "bold"}}>{ps[0]}</span>-<span>{ps[1]} : </span>
                            </>
                        )
                    else {
                        if (problemInfo?.problemCode === undefined) return ""
                        try {
                            const value = String.fromCharCode('A'.charCodeAt(0) + parseInt(problemInfo?.problemCode) - 1)
                            return <span style={{fontWeight: "bold"}}>{value} : </span>
                        } catch (e) {
                            return problemInfo?.problemCode
                        }
                    }
                })}

                <span>{problemInfo?.problemTitle}</span>
            </div>
            {props.showInfo && (
                <>
                    <div style={{marginTop: "5px", fontSize: "16px"}}>
                        <Space size={30}>
                            <div>
                            <span style={{fontWeight: "bold"}}>
                                {props.t("TimeLimit")}
                            </span>
                                : {problemInfo?.timeLimit} ms
                            </div>
                            <div>
                            <span style={{fontWeight: "bold"}}>
                                {props.t("MemoryLimit")}
                            </span>
                                : {problemInfo?.memoryLimit / 1024} MB
                            </div>
                        </Space>
                    </div>
                    {problemInfo?.source !== undefined && (
                        <div style={{marginTop: "5px", fontSize: "16px"}}>
                            <div>
                                <span style={{fontWeight: "bold"}}>{props.t("source")}</span>
                                : {problemInfo?.source}
                            </div>
                        </div>
                    )}
                    <div style={{marginTop: "5px", fontSize: "16px"}}>
                        <div>
                            <span style={{fontWeight: "bold"}}>{props.t("template")}</span>
                            : {getJudgeStr(problemInfo?.judgeTemplates)}
                        </div>
                    </div>
                </>
            )}
            <div style={{marginTop: "10px"}}>
                <Space size={25}>
                    {props.SubmitAPI !== undefined && (
                        <Submit
                            name={"Submit-" + props.name}
                            SubmissionListName={"Pro-SubmissionList-Recent-" + props.name}
                            API={props.SubmitAPI}
                            title={problemInfo?.problemTitle}
                            LeftSubmitCount={
                                (props.enableLeftSubmitCount && problemInfo?.submitNum) ? (problemInfo?.submitNum - totalSubmission) : undefined}
                            TopSubmissionInfo={{
                                title: problemInfo?.problemTitle,
                                scoreMod: "show",
                                testcaseMod: "show",
                                QuerySubmissionAPI: props.QuerySubmissionAPI
                            }}
                            JudgeTemplates={problemInfo?.judgeTemplates}
                            FuncTemplates={problemInfo?.functionTemplates}
                        />
                    )}
                    <ModalSubmissionList
                        btnProps={{type: "default", disabled: !props.isLogin}}
                        btnText={props.t("records")}
                        name={"Pro-SubmissionList-" + props.name}
                        API={props.SubmissionListAPI}
                        QuerySubmissionAPI={props.QuerySubmissionAPI}
                    />
                </Space>
            </div>
        </div>
    )

    const testCase = problemInfo?.problemCaseDTOList
    return (
        <div className={"Problem-Program"}>
            {/*{[''].map(() => {*/}
            {/*    // 对于以作答的题目，当分数不为 0 的时候，或默认显示分数的时显示提示*/}
            {/*    if (props.scoreMod === "show" && (props.Score !== 0 || props.isSubmissionScoreVisible === true)) {*/}
            {/*        if (props.isSubmissionScoreVisible === true) {*/}
            {/*            return (*/}
            {/*                <Badge.Ribbon*/}
            {/*                    text={*/}
            {/*                        <span>当前得分：{props.Score / props.sumScore * 100 + "%"}</span>*/}
            {/*                    }*/}
            {/*                    color={this.getColor(props.Score, props.sumScore)}>*/}
            {/*                    {ProgramHeader}*/}
            {/*                </Badge.Ribbon>*/}
            {/*            )*/}
            {/*        } else if (props.isSubmissionScoreVisible === false && props.Score !== 0) {*/}
            {/*            return (*/}
            {/*                <Badge.Ribbon*/}
            {/*                    text={*/}
            {/*                        <span>*/}
            {/*                                {props.Score !== props.sumScore && ("部分通过")}*/}
            {/*                            {props.Score === props.sumScore && ("全部通过")}*/}
            {/*                            </span>*/}
            {/*                    }*/}
            {/*                    color={this.getColor(props.Score, props.sumScore)}>*/}
            {/*                    {ProgramHeader}*/}
            {/*                </Badge.Ribbon>*/}
            {/*            )*/}
            {/*        }*/}
            {/*    } else return ProgramHeader*/}
            {/*})}*/}
            {ProgramHeader}
            {/*题目主干*/}
            <Card bordered={false} className={"problemBody"}>
                {props.showMdExport === true && (
                    <div style={{right: "24px", position: "absolute"}}>
                        <><MD2export value={markdownDescription}/></>
                    </div>
                )}
                <div id={"problem-content"} style={{overflow: "hidden"}}>
                </div>
            </Card>
            {/*测试用例*/}
            {testCase !== undefined && testCase.length !== 0 && (
                <Card bordered={false} title={props.t("SampleTestCase")} style={{marginTop: "5px"}}>
                    <SampleTestCase testCase={testCase}/>
                </Card>
            )}
        </div>
    )
}
const mapStateToProps = (state: any) => {
    const State: UserState = state.UserReducer
    const PState: ProblemState = state.ProblemReducer
    const TState: TableState = state.TableReduce
    return {
        isLogin: State.isLogin,
        ProblemInfo: PState.ProblemInfo,
        tableData: {...TState.tableData}
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ProProgram))
