import React, {Component, Dispatch} from "react";
import {Button, Card, Descriptions, Image, List, Result, Skeleton} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import {ExamState, SExamInfo} from "../Type/IExam";
import {examID} from "../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../Type/Iuser";
import {getExamInfoTodo} from "../Redux/Action/exam";
import {routerE} from "../Config/router";
import moment from "moment";
import {TimeDiff} from "../Utils/Time";

const {Meta} = Card;

class EWait extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ExamStart: false
        }
        this.setExamStart = this.setExamStart.bind(this)
    }

    setExamStart = (data: boolean) => {
        if (data != this.state.ExamStart)
            this.setState({ExamStart: data})
    }

    componentDidMount() {
        if (!this.props.isLogin) {
            this.props.history.push(routerE[0].path)
        }
        this.props.getExamInfo(this.props.match.params.eid)
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (!this.props.isLogin) {
            this.props.history.push(routerE[0].path)
        }
    }


    render() {

        const examInfo = this.props.examInfo
        let description:any = ""
        let ExamStartText = this.props.t("StartAnswering")
        if (examInfo != undefined) {
            if (examInfo.startTime < Date.now() && examInfo.endTime > Date.now() && examInfo.userIsSubmit != 1) this.setExamStart(true)
            if (examInfo.endTime < Date.now()) ExamStartText = "已结束"
            if (examInfo.userIsSubmit == 1) ExamStartText = "已交卷"
            description = examInfo.description
            const start = moment(examInfo.startTime), end = moment(examInfo.endTime)
            description = "考试时长：" + TimeDiff(examInfo.startTime, examInfo.endTime) + "\n" + description
            if (start.format("LL") == end.format("LL"))
                description = "考试时间：" + start.format("LL") + "(" + start.format("dddd") + ") " + start.format("HH:mm") + " - " + end.format("HH:mm") + "\n" + description
            else
                description = "考试时间：" + start.format("LL") + "(" + start.format("dddd") + ") " + start.format("HH:mm") + " - "
                    + end.format("LL") + "(" + end.format("dddd") + ") " + end.format("HH:mm") + "\n" + description

        }

        return (
            <>
                <Skeleton active loading={!this.props.ExamInfoLoad}>
                    <Result
                        className={"Ewait"}
                        icon={<Image width={200} src={SDU_Logo} preview={false}/>}
                        title={examInfo?.title}
                        extra={
                            <div className={"Ewait-content"}>
                                <Card
                                    cover={
                                        <Timer name={this.props.t("Countdown")}
                                               deadline={examInfo?.startTime}
                                               onFinish={() => this.setExamStart(true)}
                                        />
                                    }
                                    actions={[
                                        <Button type="primary"
                                                disabled={!this.state.ExamStart}
                                                onClick={() => {
                                                    this.props.history.push("/v2/exam/running/" + this.props.match.params.eid)
                                                }}
                                        >
                                            {ExamStartText}
                                        </Button>
                                    ]}
                                    className={"exam-wait-card"}
                                >
                                    <Meta title={this.props.t("ExamDescription")} description={
                                        <List
                                            size="small"
                                            dataSource={description.split('\n').filter((value: string) => value != "")}
                                            renderItem={
                                                (item: string, index) => {
                                                    return (
                                                        <List.Item>{index + 1}. <span>{item}</span></List.Item>
                                                    )
                                                }
                                            }
                                        />

                                    } className={"exam-wait-tip"}/>
                                </Card>
                            </div>
                        }
                    />
                </Skeleton>

            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const UState: UserState = state.UserReducer
    return {
        isLogin: UState.isLogin,
        examInfo: State.examInfo,
        ExamInfoLoad: State.ExamInfoLoad,
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    getExamInfo: (eid: examID) => dispatch(getExamInfoTodo(eid))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(EWait)
    ))