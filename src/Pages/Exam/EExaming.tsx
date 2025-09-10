import React, {Component} from "react";
import {Button, Layout} from "antd";
import { PageContainer } from '@ant-design/pro-components';
import ExamRun from "../../Component/exam/ExamRun";
import ChangeLang from "../../Component/common/ChangeLang";
import {withTranslation} from "react-i18next";

interface IUserInfo {
    name: string                        // 姓名
    AdmissionTicketNumber?: string      // 准考证号
    studentID?: string                  // 学号
    IDNumber?: string                   // 身份证号
}

class EExaming extends Component<any, any> {


    render() {
        return (
                        <div className={"exam-container"}>
                                <PageContainer
                                        header={{
                                            title: this.props.t?.('ExamTitle'),
                                            extra: [
                                                <ChangeLang key="lang"/>,
                                                <Button key="2">{this.props.t?.('TempSave')}</Button>,
                                                <Button key="1" type="primary" danger>
                                                    {this.props.t?.('SubmitPaper')}
                                                </Button>,
                                            ],
                                        }}
                                        className={"exam-content"}
                                >
                                        <ExamRun/>
                                </PageContainer>
                                <Layout.Footer style={{textAlign: 'center'}}>{this.props.t?.('ExamFooterBrand')}</Layout.Footer>
                        </div>
        )
    }
}

export default withTranslation()(EExaming)