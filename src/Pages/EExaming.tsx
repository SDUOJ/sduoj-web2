import React, {Component} from "react";
import {Button, Result, Image, Card, Avatar, Descriptions, PageHeader} from "antd";
import {SmileOutlined} from "@ant-design/icons";
import Countdown from "antd/lib/statistic/Countdown";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import ExamLogin from "../Component/exam/ExamLogin";
import {Footer} from "antd/lib/layout/layout";
import ExamRun from "../Component/exam/ExamRun";
import ChangeLang from "../Component/common/ChangeLang";

interface IUserInfo {
    name: string                        // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}

export default class EExaming extends Component<any, any> {


    render() {
        return (
            <>
                <PageHeader
                    ghost={false}
                    title="《计算导论与程序设计》期末考试"
                    extra={[
                        <ChangeLang/>,
                        <Button key="2">暂存</Button>,
                        <Button key="1" type="primary" danger>
                            交卷
                        </Button>,
                    ]}
                >
                    <ExamRun/>
                </PageHeader>
                <Footer style={{textAlign: 'center'}}>山东大学计算机科学与技术学院 ©2020-2021</Footer>
            </>
        )
    }
}