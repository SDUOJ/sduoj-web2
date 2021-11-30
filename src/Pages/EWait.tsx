import React, {Component, Dispatch} from "react";
import {Button, Result, Image, Card, Avatar, Descriptions, Skeleton, List} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import ExamLogin from "../Component/exam/ExamLogin";
import {ExamState, IUserExamInfo} from "../Type/IExam";
import {examID} from "../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserInfo, UserState} from "../Type/Iuser";
import {userGetProfileTodo} from "../Redux/Action/user";
import {EWaitInitTodo, getExamInfoTodo} from "../Redux/Action/exam";
import {ConfigState} from "../Type/IConfig";
import cookie from "react-cookies";

const {Meta} = Card;

class EWait extends Component<any, any> {


    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        this.props.EWaitInit(this.props.match.params.eid)
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
                {
                    [''].map(() => {
                        if (!this.props.isLogin) {
                            return <ExamLogin/>
                        } else {
                            return (
                                <Skeleton active loading={!this.props.ExamInfoLoad}>
                                    <Result
                                        className={"Ewait"}
                                        icon={<Image width={200} src={SDU_Logo} preview={false}/>}
                                        title={this.props.examTitle}
                                        extra={
                                            <div className={"Ewait-content"}>
                                                <Meta title={this.props.t("ExamDescription")} description={
                                                    <List
                                                        size="small"
                                                        dataSource={[this.props.examDescription]}
                                                        renderItem={
                                                            (item, index) => {
                                                                return (
                                                                    <List.Item>{index + 1}. <span>{item}</span></List.Item>
                                                                )
                                                            }
                                                        }
                                                    />

                                                } className={"exam-wait-tip"}/>
                                                <Card
                                                    cover={
                                                        <Timer name={this.props.t("Countdown")} deadline={this.props.examStartTime}/>
                                                    }
                                                    actions={[
                                                        <Button type="primary"
                                                                disabled={this.props.ExamStartDisable}>
                                                            {this.props.t("StartAnswering")}
                                                        </Button>
                                                    ]}
                                                    className={"exam-wait-card"}
                                                >
                                                    <Meta title={this.props.t("CandidateInformation")} className={"exam-wait-userInfo"} description={
                                                        <Descriptions>
                                                            {
                                                                UserInfo.map((c) => {
                                                                    if (c.val != undefined)
                                                                        return (
                                                                            <Descriptions.Item
                                                                                label={c.key}
                                                                                span={3}>
                                                                                {c.val}
                                                                            </Descriptions.Item>
                                                                        )
                                                                })
                                                            }
                                                        </Descriptions>
                                                    }
                                                    />
                                                </Card>
                                            </div>
                                        }
                                    />
                                </Skeleton>
                            )
                        }
                    })
                }
            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const CState: ConfigState = state.ConfigReducer
    const UState: UserState = state.UserReducer
    let userInfo: IUserExamInfo = {
        name: UState.userInfo?.realName,
        studentID: UState.userInfo?.sduId
    }
    return {
        isLogin: UState.isLogin,
        userInfo: userInfo,

        ExamInfoLoad: State.ExamInfoLoad,
        examTitle: State.examInfo?.title,
        examStartTime: State.examInfo?.startTime,
        examDescription: State.examInfo?.description,
        examId: State.examId,

        ExamStartDisable: State.examInfo?.startTime == undefined ?
            true : CState.timestamp < State.examInfo?.startTime
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    EWaitInit: (eid: examID) => dispatch(EWaitInitTodo(eid))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(EWait)
    ))