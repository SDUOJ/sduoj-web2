import React, {useEffect, useState} from "react";
import {Button, Card, Image, List, message, Result} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../../Component/common/Timer";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {TimeRangeState} from "../../Utils/Time";
import LoginCheck from "../../Component/common/LoginCheck";
import useExamInfo from "../../Component/exam/API/getExamInfo";
import {isValueEmpty} from "../../Utils/empty";
import {UrlPrefix} from "../../Config/constValue";
import {getDescription} from "../../Component/exam/ExamUtils";
import MarkdownText from "../../Utils/MarkdownText";
import {useTranslation} from "react-i18next";

const {Meta} = Card;

const EWait = (props: any) => {
    const [ExamStart, setExamStartX] = useState<boolean>(false)
    const [examState, setExamState] = useState<any>()
    const {t} = useTranslation();

    const setExamStart = (data: boolean) => {
        if (data !== ExamStart) {
            message.info(t("queuingForExamPaper"))
            setTimeout(() => {
                setExamStartX(data)
                props.history.push(UrlPrefix + "/exam/running/" + props.match.params.eid + "/0/0")
            }, Math.random() * 5000)
        }
    }

    const examInfo = useExamInfo(props.match.params.eid)

    const getExamStartText = () => {
    if (examInfo === undefined) return ""
    if (examInfo.userIsSubmit === 1) return t("submitted")
    if (examInfo.endTime < Date.now()) return t("ended")
        return props.t("StartAnswering")
    }

    if (examInfo !== undefined) {
        const examStart = examInfo.startTime < Date.now() && examInfo.endTime > Date.now() && examInfo.userIsSubmit !== 1
        if (ExamStart !== examStart) setExamStartX(examStart)
    }

    useEffect(() => {
        if (examInfo !== undefined) {
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
        if(examInfo?.openReport === 1){
            actions.push(
                <Button
                    type={"primary"}
                    onClick={()=>{
                        props.history.push(UrlPrefix + "/exam/report/" + props.match.params.eid)
                    }}
                >
                    {t("examReport")}
                </Button>
            )
        }
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
                                        <Timer name={t("timeToEnd")}
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
                                dataSource={getDescription(examInfo).split('\n').filter((value: string) => value !== "")}
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
                                            <MarkdownText id={"ExamDescription-content"} text={examInfo?.description}/>
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
