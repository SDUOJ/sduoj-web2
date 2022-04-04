import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import ListWithPagination from "../../Component/common/List/ListWithPagination";
import cApi from "../../Utils/API/c-api";
import {Button, Card, Col, Divider, Form, List, Row, Select, Space, Tag} from "antd";
import moment from "moment";
import {ClockCircleOutlined, LockFilled, TeamOutlined} from "@ant-design/icons";
import {TimeDiff, TimeRangeState} from "../../Utils/Time";
import Countdown from "antd/lib/statistic/Countdown";
import {isValueEmpty} from "../../Utils/empty";
import ContestList from "../../Component/contest/ContestList";


class CContest extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            upComing: undefined
        }
        this.getUpComing()
    }

    getUpComing = () => {
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

                                <ContestList/>

                            </Col>
                            <Col span={7}>
                                {!isValueEmpty(this.state.upComing) && (
                                    <Card
                                        title={"即将到来"}
                                        className={"smallBodyPadding bodyCenter"}
                                    >
                                        <div>
                                            <Button type={"link"} size={"large"} onClick={() => {
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
                                                    onFinish={this.getUpComing}
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