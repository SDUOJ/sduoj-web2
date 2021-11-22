import React, {Component} from "react";
import Countdown from "antd/lib/statistic/Countdown";
import {Card, Space} from "antd";
import {ClockCircleOutlined} from "@ant-design/icons"

interface ITimer {
    name?: string        // 如：距离考试结束还有
    deadline: number
    inline?: boolean
}

export default class Timer extends Component<ITimer, any> {

    render() {
        return (
            <div className={"Timer"}>
                {
                    [''].map(() => {
                        if (this.props.inline) {
                            return (
                                <Card className={"Timer-inline-card"}>
                                    <Space>
                                        <Space className={"Timer-inline"}>
                                            <ClockCircleOutlined/>
                                            倒计时：
                                        </Space>
                                        <Countdown value={this.props.deadline} format="H 时 m 分 s 秒"/>
                                    </Space>
                                </Card>
                            )
                        } else {
                            return (
                                <Card>
                                    <Countdown title={this.props.name} value={this.props.deadline}
                                               format="H 时 m 分 s 秒"/>
                                </Card>
                            )
                        }

                    })
                }

            </div>
        )
    }
}