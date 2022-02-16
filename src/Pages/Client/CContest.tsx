import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import ListWithPagination from "../../Component/common/List/ListWithPagination";
import cApi from "../../Utils/API/c-api";
import {Button, Card, Col, Divider, Form, List, Row, Select, Space, Tag} from "antd";
import moment from "moment";
import {ClockCircleOutlined, LockFilled, TeamOutlined} from "@ant-design/icons";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import Timer from "../../Component/exam/Timer";
import Countdown from "antd/lib/statistic/Countdown";


class CContest extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            myGroup: undefined,
            upComing: undefined
        }
        cApi.getMyGroup().then((res: any) => {
            this.setState({
                myGroup: res
            })
        })
        cApi.getUpcomingContest({groupId: undefined}).then((res: any) => {
            this.setState({
                upComing: res
            })
        })
    }

    render() {
        return (
            <>
                <div style={{textAlign: "center", margin: "0 auto"}}>
                    <div style={{textAlign: "left", maxWidth: "1500px", margin: "0 auto"}}>
                        <Row gutter={20}>
                            <Col span={17}>
                                <div className={"ListPage"}>
                                    <ListWithPagination
                                        title={"比赛列表"}
                                        API={cApi.getContestList}
                                        size={"small"}
                                        getForm={(onFinish: any) => {
                                            return (
                                                <Space size={30}>
                                                    {this.state.myGroup !== undefined && (
                                                        <Form.Item label={"组"} name={"groupId"}>
                                                            <Select onChange={onFinish} style={{width: 200}}
                                                                    defaultValue={""}>
                                                                <Select.Option value={""}>全部</Select.Option>
                                                                {this.state.myGroup.map((val: any) => {
                                                                    return (
                                                                        <Select.Option value={val.groupId}>
                                                                            {val.groupId}: {val.title}
                                                                        </Select.Option>
                                                                    )
                                                                })}
                                                            </Select>
                                                        </Form.Item>
                                                    )}
                                                    <Form.Item label={"赛制"} name={"mode"}>
                                                        <Select onChange={onFinish} style={{width: 80}}
                                                                defaultValue={""}>
                                                            <Select.Option value={""}>全部</Select.Option>
                                                            <Select.Option value={"acm"}>ACM</Select.Option>
                                                            <Select.Option value={"ioi"}>IOI</Select.Option>
                                                            <Select.Option value={"oi"}>OI</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Space>
                                            )
                                        }}
                                        useFormBtn={false}
                                        defaultPageSize={15}
                                        renderItem={(item: any) => {
                                            return (
                                                <List.Item
                                                    key={item.contestId}
                                                >
                                                    <List.Item.Meta
                                                        avatar={
                                                            <div style={{}}>
                                                                <div style={{textAlign: "center", fontSize: "30px"}}>
                                                                    {moment(parseInt(item.gmtStart)).format("DD")}
                                                                </div>
                                                                <div style={{color: "#aaa"}}>
                                                                    {moment(parseInt(item.gmtStart)).format("YYYY-MM")}
                                                                </div>
                                                            </div>
                                                        }
                                                        title={
                                                            <>
                                                                <a type={"text"} style={{marginRight: 10}}
                                                                   onClick={() => {
                                                                       this.props.history.push("/v2/contest/" + item.contestId)
                                                                   }}>{item.contestTitle}</a>
                                                                {item.features.openness === "private" && (
                                                                    <LockFilled style={{color: "red"}}/>
                                                                )}
                                                                {item.features.openness === "protected" && (
                                                                    <LockFilled style={{color: "orange"}}/>
                                                                )}
                                                            </>
                                                        }
                                                        description={
                                                            <Space size={10}>
                                                                {item.features.mode === "acm" && (
                                                                    <span style={{
                                                                        backgroundColor: "#3676b6",
                                                                        color: "#fff",
                                                                        padding: "0 10px",
                                                                        borderRadius: ".75rem"
                                                                    }}>ACM</span>
                                                                )}
                                                                {item.features.mode === "ioi" && (
                                                                    <span style={{
                                                                        backgroundColor: "#ea517f",
                                                                        color: "#fff",
                                                                        padding: "0 10px",
                                                                        borderRadius: ".75rem"
                                                                    }}>IOI</span>
                                                                )}
                                                                {item.features.mode === "oi" && (
                                                                    <span style={{
                                                                        backgroundColor: "#f8df72",
                                                                        color: "#fff",
                                                                        padding: "0 10px",
                                                                        borderRadius: ".75rem"
                                                                    }}>OI</span>
                                                                )}
                                                                <Divider type={"vertical"}/>
                                                                <span>{moment(parseInt(item.gmtStart)).format("HH:mm:ss")}</span>
                                                                <Divider type={"vertical"}/>
                                                                <span><ClockCircleOutlined/> {TimeDiff(item.gmtStart, item.gmtEnd)}</span>
                                                                <Divider type={"vertical"}/>
                                                                <span><TeamOutlined/> {item.participantNum}</span>
                                                                <Divider type={"vertical"}/>
                                                                {TimeRangeState(item.gmtStart, item.gmtEnd) === "end" && (
                                                                    <Tag color={"green"}>结束</Tag>
                                                                )}
                                                                {TimeRangeState(item.gmtStart, item.gmtEnd) === "running" && (
                                                                    <Tag color={"orange"}>进行中</Tag>
                                                                )}
                                                                {item.isPublic === 0 && (
                                                                    <Tag color={"red"}>私有</Tag>
                                                                )}
                                                            </Space>

                                                        }
                                                    />
                                                </List.Item>
                                            )
                                        }}
                                        name={"ContestList"}
                                    />
                                </div>
                            </Col>
                            <Col span={7}>
                                {this.state.upComing !== undefined && (
                                    <Card
                                        title={"即将到来"}
                                        className={"smallBodyPadding bodyCenter"}
                                    >
                                        <div>
                                            <Button type={"link"} size={"large"} onClick={()=>{
                                                this.props.history.push("/v2/contest/" + this.state.upComing.contestId)
                                            }}>
                                                {this.state.upComing.contestTitle}
                                            </Button>
                                        </div>
                                        <div>
                                            <Space>
                                                <ClockCircleOutlined/>
                                                <Countdown
                                                    className={"contestTimer"}
                                                    value={parseInt(this.state.upComing.gmtStart)}
                                                    format="H 时 m 分 s 秒"
                                                />
                                            </Space>
                                        </div>
                                    </Card>
                                )}
                            </Col>
                        </Row>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CContest)