import React, {Component} from "react";
import {Button, Result, Image, Card, Avatar, Descriptions} from "antd";
import {SmileOutlined} from "@ant-design/icons";
import Countdown from "antd/lib/statistic/Countdown";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import ExamLogin from "../Component/exam/ExamLogin";

interface IUserInfo {
    name: string                        // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}


interface IEWait {
    examStartTime: number // unix 时间戳
    userInfo: IUserInfo
}

const {Meta} = Card;

export default class EWait extends Component<IEWait, any> {


    constructor(props: IEWait, context: any) {
        super(props, context);
        this.state = {
            canStartExam: true,
            UserLogin: false
        }

        setInterval(() => {
            if (this.props.examStartTime < Date.now() && this.state.UserLogin) {
                this.setState({canStartExam: false})
            }
        }, 1000)
    }


    render() {

        const UserInfo = [
            {"key": "姓名", "val": this.props.userInfo.name},
            {"key": "准考证号", "val": this.props.userInfo.AdmissionTicketNumber},
            {"key": "学号", "val": this.props.userInfo.studentID},
            {"key": "身份证号", "val": this.props.userInfo.IDNumber}
        ]

        return (
            <>
                <Result className={"Ewait"}
                        icon={<Image width={200} src={SDU_Logo} preview={false}/>}
                        title={"《计算导论与程序设计》 期末考试"}
                        extra={
                            <div className={"Ewait-content"}>
                                <Card
                                    cover={
                                        <Timer name={"距离考试开始还有"} deadline={this.props.examStartTime}/>
                                    }
                                    actions={[
                                        <Button type="primary"
                                                disabled={this.state.canStartExam}>
                                            开始答题
                                        </Button>
                                    ]}
                                >

                                    {
                                        [''].map(() => {

                                            return (
                                                <Meta
                                                    title={this.state.UserLogin ? "考生信息" : "请登录"}
                                                    description={
                                                        <>
                                                            {
                                                                [''].map(() => {
                                                                    if (!this.state.UserLogin) {
                                                                        return <ExamLogin/>
                                                                    } else {
                                                                        return (
                                                                            <Descriptions>
                                                                                {
                                                                                    UserInfo.map((c) => {
                                                                                        if (c.val != undefined) {
                                                                                            return (
                                                                                                <Descriptions.Item
                                                                                                    label={c.key}
                                                                                                    span={3}>{c.val}</Descriptions.Item>
                                                                                            )
                                                                                        }
                                                                                    })
                                                                                }
                                                                            </Descriptions>
                                                                        )
                                                                    }
                                                                })
                                                            }
                                                        </>
                                                    }
                                                />
                                            )
                                        })
                                    }


                                </Card>
                            </div>

                        }
                />
            </>
        )
    }
}