import React, {Component} from "react";
import {Card, Space} from "antd";
import AntdTimer from "../../Utils/AntdTimer";
import {ClockCircleOutlined} from "@ant-design/icons"
import {WithTranslation, withTranslation} from "react-i18next";

interface ITimer {
    name?: string        // 如：距离考试结束还有
    deadline: number
    inline?: boolean
    onFinish?:any
}

class Timer extends Component<ITimer & WithTranslation, any> {
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
                                            {this.props.t("Countdown")} :
                                        </Space>
                                        <AntdTimer
                                            value={this.props.deadline}
                                            format={this.props.t("TimeFormat")}
                                            onFinish={this.props.onFinish}
                                        />
                                    </Space>
                                </Card>
                            )
                        } else {
                            return (
                                <Card>
                                    <AntdTimer title={this.props.name} value={this.props.deadline}
                                               format={this.props.t("TimeFormat")}
                                               onFinish={this.props.onFinish}
                                    />
                                </Card>
                            )
                        }
                    })
                }
            </div>
        )
    }
}

export default withTranslation()(Timer)