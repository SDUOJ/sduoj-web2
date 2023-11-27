import {withRouter} from "react-router-dom";
import LoginCheck from "../common/LoginCheck";
import {Button, Card, Result} from "antd";
import Timer from "../common/Timer";
import {isValueEmpty} from "../../Utils/empty";
import React, {useEffect, useState} from "react";
import {TimeRangeState} from "../../Utils/Time";
import MarkdownText from "../../Utils/MarkdownText";
import cApi from "../../Utils/API/c-api"
import {UrlPrefix} from "../../Config/constValue";
import {withTranslation} from "react-i18next";

const Public = (props: any) => {
    const problemSetId = props.match.params.problemSetId

    const {Meta} = Card;
    const [info, setInfo] = useState<any>()
    const State = info && TimeRangeState(info.tm_start, info.tm_end)

    useEffect(() => {
        if (info === undefined) {
            cApi.getProblemSetPublic({psid: problemSetId}).then((res: any) => {
                setInfo(res)
            })
        }
    }, [info])

    const getStartText = () => {
        if (info === undefined) return ""
        if (info.finish === 1) return "已交卷"
        if (info.tm_end < Date.now()) return "已结束"
        return props.t("StartAnswering")
    }

    return (
        <>
            <LoginCheck jump={true}/>
            <Result
                className={"Ewait"}
                icon={<></>}
                title={info?.name}
                extra={
                    <div className={"Ewait-content"}>
                        <Card
                            cover={
                                <>
                                    {State === "wait" && (
                                        <Timer name={props.t("Countdown")}
                                               deadline={info?.tm_start}
                                               onFinish={() => setInfo(undefined)}
                                        />
                                    )}
                                    {State === "running" && (
                                        <Timer name={"距离结束"}
                                               deadline={info?.tm_end}
                                        />
                                    )}
                                </>
                            }
                            actions={[
                                [
                                    <Button
                                        type="primary" disabled={State !== "running" || info?.finish === 1}
                                        onClick={() => {
                                            props.history.push(UrlPrefix + `/problemSet/${problemSetId}/overview`)
                                        }}
                                    >
                                        {getStartText()}
                                    </Button>
                                ]
                            ]}
                            className={"exam-wait-card"}
                        >
                            {!isValueEmpty(info?.description) && (
                                <Meta
                                    style={{paddingBottom: 40}}
                                    description={
                                        <>
                                            <MarkdownText
                                                id={"problemSet-description"}
                                                text={info?.description}
                                            />
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


export default withTranslation()(withRouter(Public))
