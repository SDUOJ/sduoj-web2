import React, {useEffect, useState} from "react";
import {Col, Row} from "antd";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";
import "Assert/css/Options.scss"
import {withRouter} from "react-router-dom";
import MarkdownText from "../../../Utils/MarkdownText";

interface propType {
    key_o: string         // 题目索引名
    problemInfo: any,       // 获取题目信息
    getAS: any          // 获取用户答题信息
    onMark: any         // 标记某个选项
    onAnswerM: any      // 选择某个选项
}

const Objective = (props: propType & any) => {

    const [answerSheet, setAnswerSheet] = useState<any>(props.answerSheet)

    useEffect(() => {
        if (props.answerSheet !== undefined) {
            setAnswerSheet(props.answerSheet)
        } else {
            updateAnswerSheet()
        }
    }, [props.key_o])

    const updateAnswerSheet = () => {
        props.getAS && props.getAS().then((res: any) => {
            setAnswerSheet(res)
        })
    }

    return (
        <div className={"Choice"}>
            <div className={"Choice-title"}>
                <MarkdownText id={"Choice-title-id" + props.key_o} text={props.problemInfo?.description}/>
            </div>
            {props.problemInfo?.choice !== undefined && (
                props.problemInfo.choice.map((v: any, index: number) => {
                    return (
                        <ObjectiveOption
                            onMark={(SID: string) => {
                                props.onMark && props.onMark(SID).then(() => {
                                    updateAnswerSheet()
                                })
                            }}
                            onAnswerM={(SID: string) => {
                                props.onAnswerM && props.onAnswerM(SID).then(() => {
                                    updateAnswerSheet()
                                })
                            }}
                            mark={answerSheet?.mark ?? []}
                            answer={answerSheet?.answer ?? []}
                            answer_m={answerSheet?.answer_m ?? []}
                            index={index}
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
    mark: string        // 标记的选项
    onMark: any         // 在标记时调用
    answer_m: string    // 我的答案
    onAnswerM: any      // 在作答时调用
    answer: string      // 正确答案
}

const ObjectiveOption = (props: ObjectiveOptionType) => {

    const SID = String.fromCharCode('A'.charCodeAt(0) + props.index)

    let OptionsState = ""
    if (props.answer_m.indexOf(SID) !== -1) OptionsState = "used"
    else if (props.mark.indexOf(SID) !== -1) OptionsState = "unused"
    else OptionsState = "init"


    return (
        <>
            <div
                onContextMenu={() => {
                    props.onMark && props.onMark(SID)
                }}
                onClick={() => {
                    props.onAnswerM && props.onAnswerM(SID)
                }}
                className={"Options-" + OptionsState + ` Options-${props.answer.indexOf(SID) !== -1 ? "green" : ""}`}
            >
                <Row>
                    <Col span={1}>
                        {[''].map(() => {
                            if (OptionsState === "used") return <CheckOutlined/>
                            if (OptionsState === "unused") return <CloseOutlined/>
                            return undefined
                        })}
                    </Col>
                    <Col className={"Options-Choice"} span={1}>
                        {SID}.
                    </Col>
                    <Col className={"Options-content"} span={22}>
                        <MarkdownText id={"Options-content-id-" + props.key_o} text={props.content}/>
                    </Col>
                </Row>
            </div>
        </>
    )
}

export default withRouter(Objective);
