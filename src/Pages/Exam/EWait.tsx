import React, {Dispatch, useState} from "react";
import {Button, Card, Image, List, message, Result} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../../Component/exam/Timer";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import moment from "moment";
import {TimeDiff} from "../../Utils/Time";
import LoginCheck from "../../Component/common/LoginCheck";
import useExamInfo from "../../Component/exam/API/getExamInfo";

const {Meta} = Card;

const EWait = (props: any) => {
    const [ExamStart, setExamStartX] = useState<boolean>(false)

    const setExamStart = (data: boolean) => {
        if (data !== ExamStart) {
            message.info("正在排队发卷，请勿刷新，并耐心等待几秒")
            setTimeout(() => {
                setExamStartX(data)
                props.history.push("/v2/exam/running/" + props.match.params.eid + "/0/0")
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
        description += examInfo.description
        return description
    }
    if (examInfo !== undefined) {
        const examStart = examInfo.startTime < Date.now() && examInfo.endTime > Date.now() && examInfo.userIsSubmit !== 1
        if (ExamStart !== examStart) setExamStartX(examStart)
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
                                <Timer name={props.t("Countdown")}
                                       deadline={examInfo?.startTime}
                                       onFinish={() => setExamStart(true)}
                                />
                            }
                            actions={[
                                <Button
                                    type="primary" disabled={!ExamStart}
                                    onClick={() => {
                                        props.history.push("/v2/exam/running/" + props.match.params.eid + "/0/0")
                                    }}
                                >
                                    {getExamStartText()}
                                </Button>
                            ]}
                            className={"exam-wait-card"}
                        >
                            <Meta title={props.t("ExamDescription")} description={
                                <List
                                    size="small"
                                    dataSource={getDescription().split('\n').filter((value: string) => value !== "")}
                                    renderItem={
                                        (item: string, index) => {
                                            return (
                                                <List.Item>{index + 1}. <span>{item}</span></List.Item>
                                            )
                                        }
                                    }
                                />
                            } className={"exam-wait-tip"}/>
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