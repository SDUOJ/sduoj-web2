import React, {Component} from "react";
import Countdown from "antd/lib/statistic/Countdown";
import {Card} from "antd";

interface ITimer{
    name: string // 如：距离考试结束还有
    deadline: number
}

export default class Timer extends Component<ITimer, any> {

    render() {
        return (
            <div className={"Timer"}>
                <Card>
                    <Countdown title={this.props.name} value={this.props.deadline} format="D 天 H 时 m 分 s 秒" />
                </Card>
            </div>
        )
    }
}