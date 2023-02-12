import React, {useEffect, useState} from "react";
import {MarkdownPreview} from "../../../Utils/MarkdownPreview";
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {withRouter} from "react-router-dom";

interface propType {
    key_o: string         // 题目索引名
    problemInfo: any,       // 获取题目信息
    getAS: any          // 获取用户答题信息
    onMark: any         // 标记某个选项
    onAnswerM: any      // 选择某个选项
}

const Objective = (props: propType & any) => {

    const [answerSheet, setAnswerSheet] = useState<any>()

    useEffect(() => {
        updateAnswerSheet()
    }, [props.problemInfo])

    const updateAnswerSheet = () => {
        props.getAS().then((res: any) => {
            setAnswerSheet(res)
        })
    }


    useEffect(() => {
        if (props.problemInfo?.description !== undefined) {
            MarkdownPreview("Choice-title-id" + props.key_o, props.problemInfo.description)
        }
    }, [props.problemInfo?.description])

    const getIndex = (index: number) => {
        if (answerSheet?.order !== undefined) {
            return answerSheet.order[index]
        }
        return index
    }

    return (
        <div className={"Choice"}>
            <div className={"Choice-title"} id={"Choice-title-id" + props.key_o}>

            </div>
            {props.problemInfo?.choice !== undefined && (
                props.problemInfo.choice.map((v: any, index: number) => {
                    return (
                        <ObjectiveOption
                            onMark={(SID: string) => {
                                props.onMark(SID).then(() => {
                                    updateAnswerSheet()
                                })
                            }}
                            onAnswerM={(SID: string) => {
                                props.onAnswerM(SID).then(() => {
                                    updateAnswerSheet()
                                })
                            }}
                            mark={answerSheet?.mark ?? []}
                            answer={answerSheet?.answer ?? []}
                            answer_m={answerSheet?.answer_m ?? []}
                            index={index}
                            t_index={getIndex(index)}
                            content={v}
                            key_o={props.key_o + "-" + index.toString()}
                        />
                    )
                })
            )}
        </div>
    )
}


interface ObjectiveOptionType {
    key_o: string         // 关键字
    content: string     // 文本内容
    index: number       // 在所有选项中的编号
    t_index: number
    mark: string        // 标记的选项
    onMark: any         // 在标记时调用
    answer_m: string    // 我的答案
    onAnswerM: any      // 在作答时调用
    answer: string      // 正确答案
}

const ObjectiveOption = (props: ObjectiveOptionType) => {
    useEffect(() => {
        if (props.content !== undefined) {
            MarkdownPreview("Options-content-id-" + props.key_o, props.content)
        }
    }, [props.content])

    const SID = String.fromCharCode('A'.charCodeAt(0) + props.index)
    const t_SID = String.fromCharCode('A'.charCodeAt(0) + props.t_index)

    let OptionsState = ""
    if (props.answer_m.includes(t_SID)) OptionsState = "used"
    else if (props.mark.includes(t_SID)) OptionsState = "unused"
    else OptionsState = "init"


    return (
        <>
            <div
                onContextMenu={() => {
                    props.onMark && props.onMark(t_SID)
                }}
                onClick={() => {
                    props.onAnswerM && props.onAnswerM(t_SID)
                }}
                className={"Options-" + OptionsState + ` Options-${props.answer.includes(t_SID) ? "green" : ""}`}
            >
                <Row>
                    <Col span={1}>
                        {[''].map(() => {
                            if (OptionsState === "used") return <CheckOutlined/>
                            if (OptionsState === "unused") return <CloseOutlined/>
                        })}
                    </Col>
                    <Col className={"Options-Choice"} span={1}>
                        {SID}.
                    </Col>
                    <Col className={"Options-content"} span={22}>
                        <div id={"Options-content-id-" + props.key_o}>
                        </div>
                    </Col>
                </Row>
            </div>
        </>
    )
}

export default withRouter(Objective);
