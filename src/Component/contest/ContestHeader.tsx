import {withTranslation} from "react-i18next";
import {withRouter} from "react-router-dom";
import {Alert, Card, Col, Divider, Menu, message, Row, Slider, Space} from "antd";
import React, {Dispatch, useEffect, useState} from "react";
import getContestInfo from "./API/getContestInfo";
import {MarkdownPreview} from "../../Utils/MarkdownPreview";
import {TimeDiff, TimeRangeState, unix2Time} from "../../Utils/Time";
import Countdown from "antd/lib/statistic/Countdown";
import moment from "moment";
import {ClockCircleOutlined, LockFilled, TeamOutlined} from "@ant-design/icons";
import {ContestState} from "../../Redux/Action/contest";
import {connect} from "react-redux";
import {UserState} from "../../Type/Iuser";
import {isValueEmpty} from "../../Utils/empty";
import DTime from "../common/DTime";

const ContestHeader = (props: any) => {

    const [selectedKey, setSelectedKey] = useState<string>("")
    const contestId = props.match.params.contestId
    const url = props.location.pathname
    const contestInfo = getContestInfo(contestId)

    // console.log(contestInfo)

    const menuData = [
        {name: "Register", link: "/v2/contest/" + contestId + "/register", re: /\/v2\/contest\/.*\/register/g},
        {name: "Overview", link: "/v2/contest/" + contestId + "/overview", re: /\/v2\/contest\/.*\/overview/g},
        {name: "Problem", link: "/v2/contest/" + contestId + "/problem/1", re: /\/v2\/contest\/.*\/problem\/.*/g},
        {name: "Status", link: "/v2/contest/" + contestId + "/submission", re: /\/v2\/contest\/.*\/submission/g},
        {name: "Rank", link: "/v2/contest/" + contestId + "/rank", re: /\/v2\/contest\/.*\/rank/g},
    ]


    useEffect(() => {
        if (contestInfo !== undefined && !isValueEmpty(contestInfo.markdownDescription)) {
            MarkdownPreview("contest-markdownDescription", contestInfo.markdownDescription)
        }
    }, [contestInfo])


    const timeState = contestInfo !== undefined ? TimeRangeState(contestInfo.gmtStart, contestInfo.gmtEnd) : undefined
    const isPractice = contestInfo !== undefined ? (contestInfo.participants.indexOf(props.username) !== -1) : undefined
    const openness = contestInfo !== undefined ? contestInfo.features.openness : undefined

    useEffect(() => {
        if (url.match(/\/v2\/contest\/[0-9]*\/?$/g) !== null && openness !== undefined && isPractice !== undefined) {
            // 在私有模式下，率先跳转到注册页面
            if (openness === "private" && !isPractice) props.history.replace(menuData[0].link)
            else props.history.replace(menuData[1].link)
        }
        // 若已经注册，则不能访问注册页面
        if(url.match(menuData[0].re) !== null && isPractice) props.history.replace(menuData[1].link)
        menuData.map((value) => {
            if (url.match(value.re) !== null) setSelectedKey(value.name)
        })
    }, [url, openness, isPractice])


    return (
        <>
            {contestInfo !== undefined && (
                <>
                    {!isValueEmpty(contestInfo.markdownDescription) && (
                        <Alert
                            message={
                                <div id={"contest-markdownDescription"}>
                                </div>
                            }
                            type="info"
                        />
                    )}
                    <Card style={{marginTop: 25}}>
                        <div className={"center"}>
                            <span style={{float: "left"}}>
                                <span style={{fontWeight: "bold"}}>开始时间：</span>
                                {unix2Time(contestInfo.gmtStart)}
                            </span>
                            <span style={{fontWeight: "bold", fontSize: "1.75rem"}}>
                                <span style={{paddingRight: 10}}>{contestInfo.contestTitle}</span>
                                {contestInfo.features.openness === "private" && (
                                    <LockFilled style={{color: "red"}}/>
                                )}
                                {contestInfo.features.openness === "protected" && (
                                    <LockFilled style={{color: "orange"}}/>
                                )}
                            </span>
                            <span style={{float: "right"}}>
                                <span style={{fontWeight: "bold"}}>结束时间：</span>
                                {unix2Time(contestInfo.gmtEnd)}
                            </span>
                        </div>
                        {timeState !== "wait" && (
                            <Slider
                                style={{marginTop: 25}}
                                tipFormatter={null}
                                min={parseInt(contestInfo.gmtStart)}
                                max={parseInt(contestInfo.gmtEnd)}
                                value={Math.max(Math.min(Date.now(), parseInt(contestInfo.gmtEnd)), parseInt(contestInfo.gmtStart))}
                            />
                        )}
                        <div style={{marginTop: 15}} className={"center"}>
                            <Row>
                                <Col span={8}>
                                    {timeState === "running" && (
                                        <span style={{float: "left"}}>
                                    <span style={{fontWeight: "bold"}}>已用时间：</span>
                                    <DTime type={"before"} time={contestInfo.gmtStart}/>
                                </span>
                                    )}
                                </Col>
                                <Col span={8}>
                                    {timeState === "wait" && (
                                        <span style={{color: "blue"}}>
                                    <Space>
                                        距离开始还有：
                                        <Countdown
                                            className={"contestHeaderTimer"}
                                            value={parseInt(contestInfo.gmtStart)}
                                            format="H 时 m 分 s 秒"
                                        />
                                    </Space>
                                </span>
                                    )}
                                    {timeState === "running" && (
                                        <span style={{color: "red"}}>进行中</span>
                                    )}
                                    {timeState === "end" && (
                                        <span style={{color: "green"}}>已结束</span>
                                    )}
                                </Col>
                                <Col span={8}>
                                    {timeState === "running" && (
                                        <span style={{float: "right"}}>
                                    <span style={{fontWeight: "bold"}}>剩余时间：</span>
                                    <DTime type={"after"} time={contestInfo.gmtEnd}/>
                                </span>
                                    )}
                                </Col>
                            </Row>
                        </div>
                    </Card>

                </>
            )}
            <Row style={{backgroundColor: "white"}}>
                <Col span={12}>
                    <Menu
                        mode="horizontal"
                        theme={"light"}
                        selectedKeys={[selectedKey]}
                    >
                        {menuData.map((value) => {
                            if (timeState === "wait" && value.name !== "Register") return
                            if (isPractice && value.name === "Register") return
                            if (openness === "private" && isPractice === false && value.name !== "Register") return
                            return (
                                <Menu.Item key={value.name} onClick={() => {
                                    setSelectedKey(value.name)
                                    props.history.push(value.link)
                                }}
                                >
                                    {props.t(value.name)}
                                </Menu.Item>
                            )
                        })}
                    </Menu>

                </Col>
                <Col span={12}>
                    {contestInfo !== undefined && (
                        <Space size={10} style={{
                            marginTop: "12px",
                            marginRight: "30px",
                            marginBottom: "12px",
                            float: "right",
                            color: "grey"
                        }}>
                            {contestInfo.features.mode === "acm" && (
                                <span style={{
                                    backgroundColor: "#3676b6",
                                    color: "#fff",
                                    padding: "0 10px",
                                    borderRadius: ".75rem"
                                }}>ACM</span>
                            )}
                            {contestInfo.features.mode === "ioi" && (
                                <span style={{
                                    backgroundColor: "#ea517f",
                                    color: "#fff",
                                    padding: "0 10px",
                                    borderRadius: ".75rem"
                                }}>IOI</span>
                            )}
                            {contestInfo.features.mode === "oi" && (
                                <span style={{
                                    backgroundColor: "#f8df72",
                                    color: "#fff",
                                    padding: "0 10px",
                                    borderRadius: ".75rem"
                                }}>OI</span>
                            )}
                            <Divider type={"vertical"}/>
                            <span><ClockCircleOutlined/> {TimeDiff(contestInfo.gmtStart, contestInfo.gmtEnd)}</span>
                            <Divider type={"vertical"}/>
                            <span><TeamOutlined/> {contestInfo.participantNum}</span>
                        </Space>
                    )}
                </Col>
            </Row>
        </>
    )
}

const mapStateToProps = (state: any) => {
    const State: UserState = state.UserReducer
    return {
        username: State.userInfo?.username
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ContestHeader)))