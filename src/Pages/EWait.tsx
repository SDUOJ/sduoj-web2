import React, {Component, Dispatch} from "react";
import {Button, Card, Descriptions, Image, List, Result, Skeleton} from "antd";
import SDU_Logo from "Assert/img/sdu-logo.jpg"
import Timer from "../Component/exam/Timer";
import {ExamState} from "../Type/IExam";
import {examID} from "../Type/types";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";
import {UserState} from "../Type/Iuser";
import {getExamInfoTodo} from "../Redux/Action/exam";
import {routerE} from "../Config/router";

const {Meta} = Card;

function getIfExist(val: any, def: any) {
    if (val === undefined) return def
    return val
}

class EWait extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            ExamStart: false
        }
        this.setExamStart = this.setExamStart.bind(this)
    }

    setExamStart = (data: boolean) => {
        this.setState({ExamStart: data})
    }

    componentDidMount() {
        if (!this.props.isLogin) {
            sessionStorage.setItem("returnPath", routerE[2].path)
            this.props.history.push(routerE[0].path)
        }
        this.props.getExamInfo(this.props.match.params.eid)
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (!this.props.isLogin) {
            sessionStorage.setItem("returnPath", routerE[2].path)
            this.props.history.push(routerE[0].path)
        }
    }


    render() {
        const userInfo = this.props.userInfo
        const UserInfo = [
            {"key": "姓名", "val": getIfExist(userInfo?.realName, userInfo?.nickname)},
            {"key": "学号", "val": getIfExist(userInfo?.sduId, userInfo?.studentId)},
        ]
        const examInfo = this.props.examInfo

        return (
            <>
                <Skeleton active loading={!this.props.ExamInfoLoad}>
                    <Result
                        className={"Ewait"}
                        icon={<Image width={200} src={SDU_Logo} preview={false}/>}
                        title={examInfo?.title}
                        extra={
                            <div className={"Ewait-content"}>
                                <Meta title={this.props.t("ExamDescription")} description={
                                    <List
                                        size="small"
                                        dataSource={examInfo != undefined ? examInfo.description.split('\n').filter((value: string) => value != "") : undefined}
                                        renderItem={
                                            (item: string, index) => {
                                                return (
                                                    <List.Item>{index + 1}. <span>{item}</span></List.Item>
                                                )
                                            }
                                        }
                                    />

                                } className={"exam-wait-tip"}/>
                                <Card
                                    cover={
                                        <Timer name={this.props.t("Countdown")}
                                               deadline={examInfo?.startTime}
                                               onFinish={() => this.setExamStart(true)}
                                        />
                                    }
                                    actions={[
                                        <Button type="primary"
                                                disabled={!this.state.ExamStart}>
                                            {this.props.t("StartAnswering")}
                                        </Button>
                                    ]}
                                    className={"exam-wait-card"}
                                >
                                    <Meta title={this.props.t("CandidateInformation")}
                                          className={"exam-wait-userInfo"} description={
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

            </>
        )
    }
}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    const UState: UserState = state.UserReducer
    console.log("State", State.examInfo)
    return {
        isLogin: UState.isLogin,
        examInfo: State.examInfo,
        ExamInfoLoad: State.ExamInfoLoad,
        userInfo: UState.userInfo
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