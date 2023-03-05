import MarkdownText from "../../../Utils/MarkdownText";
import {useEffect, useState} from "react";
import {withRouter} from "react-router-dom";
import {Alert, Button, Card, Col, InputNumber, message, Radio, Row, Space} from "antd";
import Editor from "../../common/Editor";
import Title from "antd/es/typography/Title";
import {isValueEmpty} from "../../../Utils/empty";
import {CheckOutlined, CloseOutlined} from "@ant-design/icons";

const Subjective = (props: any) => {

    const [answerSheet, setAnswerSheet] = useState<any>()
    const [open, setOpen] = useState<any>(false)

    const updateAnswerSheet = () => {
        props.getAS().then((res: any) => {
            if (res.answer_m === null) res.answer_m = [""]
            setAnswerSheet(res)
        })
    }

    useEffect(() => {
        updateAnswerSheet()
        setOpen(false)
    }, [props.problemInfo])


    return (
        <>
            <MarkdownText
                id={"subjective-content-" + props.key_o}
                text={props.problemInfo?.description}
            />
            <Card title={
                <Title level={5}> 我的答案 </Title>
            } style={{marginTop: 24}}>
                {open === false && (
                    <MarkdownText
                        id={"subjective-content-myAnswer-" + props.key_o}
                        text={isValueEmpty(answerSheet?.answer_m[0]) ? "<div style='text-align: center; font-weight: bold'>未作答</div>" : answerSheet?.answer_m[0]}
                    />
                )}
                {open === true && (
                    <Editor
                        height={400}
                        value={answerSheet?.answer_m[0]}
                        onChange={(value: string) => {
                            answerSheet.answer_m[0] = value
                            props.onAnswerM(answerSheet.answer_m).then((res: any) => {
                                message.info("答案保存成功")
                            })
                        }}
                    />
                )}
                {props.finish !== true && (
                    <div style={{textAlign: "center", marginTop: 24}}>
                        <Button type={"primary"} onClick={() => {
                            if (open === false) {
                                setOpen(true)
                            } else {
                                props.onAnswerM(answerSheet.answer_m).then((res: any) => {
                                    setOpen(false)
                                })
                            }
                        }}>{open ? "提交答案" : "开始作答"}</Button>
                        <div style={{marginTop: 12, fontWeight: "bold", color: "red"}}>
                            请务必在完成本题作答后，点击【提交答案】，否则答案可能不会保存
                        </div>
                    </div>
                )}
            </Card>
            {props.finish === true && (
                <Card title={<Title level={5}> 批阅与答案 </Title>} style={{marginTop: 24}}>
                    {isValueEmpty(answerSheet?.judgeLog) && (
                        <>
                            {isValueEmpty(answerSheet?.judgeLock) && (
                                <>未批阅</>
                            )}
                            {!isValueEmpty(answerSheet?.judgeLock) && (
                                <>正在批阅</>
                            )}
                        </>
                    )}
                    {answerSheet?.judgeLog && answerSheet.judgeLog.map((data: any, index: number) => {
                        const config = answerSheet?.judgeConfig[index];
                        return (
                            <>
                                <Card
                                    title={
                                        <div style={{fontSize: 16}}>
                                            【{data.jScore}/{data.score}】
                                            {data.name}
                                        </div>
                                    }
                                    size={"small"}
                                    bordered={false}
                                >
                                    {config && !isValueEmpty(config?.answer) && (
                                        <Alert
                                            message={
                                                <MarkdownText
                                                    id={`subjective-problem-answer-${index}`}
                                                    text={config.answer}
                                                />
                                            }
                                            type="success"
                                        />
                                    )}
                                </Card>
                            </>
                        )
                    })}
                    {!isValueEmpty(answerSheet?.judgeComment) && (
                        <Card
                            title={
                                <span style={{fontSize: 16}}> 评阅备注 </span>
                            }
                            size={"small"}
                            bordered={false}
                        >
                            <Alert
                                message={
                                    <MarkdownText
                                        id={`subjective-problem-answer-comment`}
                                        text={answerSheet?.judgeComment}
                                    />
                                }
                                type="info"
                            />
                        </Card>
                    )}
                </Card>
            )}
        </>
    )
}

export default withRouter(Subjective)
