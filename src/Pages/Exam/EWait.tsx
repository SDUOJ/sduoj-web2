import React, {useEffect, useState} from "react";
import {Button, Card, Image, List, message, Result} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../../Component/exam/Timer";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import moment from "moment";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import LoginCheck from "../../Component/common/LoginCheck";
import useExamInfo from "../../Component/exam/API/getExamInfo";
import {MarkdownPreview} from "../../Utils/MarkdownPreview";
import {isValueEmpty} from "../../Utils/empty";
import {UrlPrefix} from "../../Config/constValue";

const {Meta} = Card;

const EWait = (props: any) => {
    const [ExamStart, setExamStartX] = useState<boolean>(false)
    const [examState, setExamState] = useState<any>()

    const setExamStart = (data: boolean) => {
        if (data !== ExamStart) {
            message.info("正在排队发卷，请勿刷新，并耐心等待几秒")
            setTimeout(() => {
                setExamStartX(data)
                props.history.push(UrlPrefix + "/exam/running/" + props.match.params.eid + "/0/0")
            }, Math.random() * 5000)
        }
    }

    const examInfo = useExamInfo(props.match.params.eid)

    const getExamStartText = () => {
        if (examInfo === undefined) return ""
        if (examInfo.userIsSubmit === 1) return "已交卷"
        if (examInfo.endTime < Date.now()) return "已结束"
        return props.t("StartAnswering")
    }

    const getDescription = () => {
        if (examInfo === undefined) return ""
        let description: string = ""
        const start = moment(examInfo.startTime), end = moment(examInfo.endTime)
        description += "考试时长：" + TimeDiff(examInfo.startTime, examInfo.endTime) + "\n"
        description += "考试时间："
            + start.format("LL") + "(" + start.format("dddd") + ") "
            + start.format("HH:mm") + " - "
            + (start.format("LL") === end.format("LL") ? "" : (
                end.format("LL") + "(" + end.format("dddd") + ") "
            )) + end.format("HH:mm") + "\n"
        return description
    }

    if (examInfo !== undefined) {
        const examStart = examInfo.startTime < Date.now() && examInfo.endTime > Date.now() && examInfo.userIsSubmit !== 1
        if (ExamStart !== examStart) setExamStartX(examStart)
    }

    useEffect(() => {
        if (examInfo !== undefined) {
            if (!isValueEmpty(examInfo.description))
                MarkdownPreview("ExamDescription-content", examInfo.description)
            setExamState(TimeRangeState(examInfo.startTime, examInfo.endTime))
        }
    }, [examInfo, examState])

    let actions: any = [
        <Button
            type="primary" disabled={!ExamStart}
            onClick={() => {
                props.history.push(UrlPrefix + "/exam/running/" + props.match.params.eid + "/0/0")
            }}
        >
            {getExamStartText()}
        </Button>
    ]
    if (examState === 'end') {
        actions.push(
            <Button
                type={"primary"}
            >
                报告
            </Button>
        )
    }

    return (
        <>
            <LoginCheck/>
            <Result
                className={"Ewait"}
                icon={<Image width={200} src={SDU_Logo} preview={false}/>}
                title={examInfo?.title}
                extra={
                    <div className={"Ewait-content"}>
                        <Card
                            cover={
                                <>
                                    {examState === "wait" && (
                                        <Timer name={props.t("Countdown")}
                                               deadline={examInfo?.startTime}
                                               onFinish={() => setExamStart(true)}
                                        />
                                    )}
                                    {examState === "running" && (
                                        <Timer name={"距离结束"}
                                               deadline={examInfo?.endTime}
                                        />
                                    )}
                                </>
                            }
                            actions={actions}
                            className={"exam-wait-card"}
                        >
                            <List
                                size="small"
                                dataSource={getDescription().split('\n').filter((value: string) => value !== "")}
                                renderItem={
                                    (item: string, index) => {
                                        return (
                                            <List.Item>{item}</List.Item>
                                        )
                                    }
                                }
                            />
                            {!isValueEmpty(examInfo?.description) && (
                                <Meta
                                    style={{marginTop: 20, paddingBottom: 40}}
                                    title={props.t("ExamDescription")}
                                    description={
                                        <>
                                            <div id={"ExamDescription-content"}>
                                            </div>
                                        </>
                                    } className={"exam-wait-tip"}/>
                            )}
                        </Card>
                    </div>
                }
            />
        </>
    )
}

export default withTranslation()(
    withRouter(EWait)
)