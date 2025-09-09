import React, {Component} from "react";
import {Button, Layout} from "antd";
import { PageContainer } from '@ant-design/pro-components';
import ExamRun from "../../Component/exam/ExamRun";
import ChangeLang from "../../Component/common/ChangeLang";

interface IUserInfo {
    name: string                        // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}

export default class EExaming extends Component<any, any> {


    render() {
        return (
                        <div className={"exam-container"}>
                                <PageContainer
                                        header={{
                                            title: '《计算导论与程序设计》期末考试',
                                            extra: [
                                                <ChangeLang key="lang"/>,
                                                <Button key="2">暂存</Button>,
                                                <Button key="1" type="primary" danger>
                                                    交卷
                                                </Button>,
                                            ],
                                        }}
                                        className={"exam-content"}
                                >
                                        <ExamRun/>
                                </PageContainer>
                                <Layout.Footer style={{textAlign: 'center'}}>山东大学计算机科学与技术学院 ©2020-2021</Layout.Footer>
                        </div>
        )
    }
}