import React, {Component} from "react";
import {withRouter} from "react-router-dom";
import cApi from "../../Utils/API/c-api";
import {Button, Card, Col, Row, Space} from "antd";
import {ClockCircleOutlined} from "@ant-design/icons";
import Countdown from "antd/lib/statistic/Countdown";
import {isValueEmpty} from "../../Utils/empty";
import ContestList from "../../Component/contest/ContestList";
import {UrlPrefix} from "../../Config/constValue";
import {withTranslation} from "react-i18next";


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
                                        title={this.props.t("ComingSoon")}
                                        className={"smallBodyPadding bodyCenter"}
                                    >
                                        <div>
                                            <Button type={"link"} size={"large"} onClick={() => {
                                                this.props.history.push(UrlPrefix + "/contest/" + this.state.upComing.contestId)
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
                                                    format={this.props.t("TimeFormat")}
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

export default withTranslation()(withRouter(CContest))
