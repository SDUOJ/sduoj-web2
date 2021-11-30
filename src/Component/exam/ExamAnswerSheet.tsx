import React, {Component, Dispatch} from "react";
import {Card, Skeleton, Space} from "antd";
import Meta from "antd/lib/card/Meta";
import ProTagGroup from "./ProTagGroup";
import ProTag from "./ProTag";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {ExamState} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {withRouter} from "react-router";
import {getExamProblemListTodo} from "../../Redux/Action/exam";


class ExamAnswerSheet extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        if (this.props.examId == undefined) {
            this.props.setExamID(this.props.match.params.eid)
        }
    }

    render() {
        let ProList: { "title": string, "proList": number[] }[] = []

        if (!this.props.Loading) {
            // 如果题目列表已经加载完成，构建题目列表
            ProList = [
                {"title": this.props.t(this.props.ProInfo[0].type), "proList": [this.props.ProInfo[0].index]}
            ]
            for (let i = 1; i < this.props.ProInfo.length; i++) {
                if (this.props.ProInfo[i].type == this.props.ProInfo[i - 1].type) {
                    ProList[ProList.length - 1].proList.push(this.props.ProInfo[i].index)
                } else {
                    ProList.push({
                        "title": this.props.t(this.props.ProInfo[i].type),
                        "proList": [this.props.ProInfo[i].index]
                    })
                }
            }
        } else {
            // 考试信息未导入成功
            if (this.props.ExamID == undefined) {
                console.log(this.props.location.pathname)
            } else {
                this.props.GetProList(this.props.ExamID)
            }
        }
        return (
            <div className={"ExamAnswerSheet"}>
                <Card>
                    <Meta className={"ExamAnswerSheetMeta"}
                          title={this.props.t("AnswerSheet")}
                          description={
                              <>
                                  <div style={{margin: "0 auto", textAlign: "center"}}>
                                      <Space>
                                          <ProTag ProIndex={0} ProURL={""} TagState={["d"]}
                                                  exp={this.props.t("Unanswered")}/>
                                          <ProTag ProIndex={0} ProURL={""} TagState={["f"]}
                                                  exp={this.props.t("Answered")}/>
                                          <ProTag ProIndex={0} ProURL={""} TagState={["c", "d"]}
                                                  exp={this.props.t("Marked")}/>
                                      </Space>
                                  </div>


                                  <Skeleton active loading={this.props.Loading}>
                                      {
                                          ProList.map((Value: { "title": string, "proList": number[] }) => {
                                              return (
                                                  <ProTagGroup title={Value.title} proList={Value.proList}/>
                                              )
                                          })
                                      }
                                  </Skeleton>
                              </>
                          }
                    />
                </Card>
            </div>
        )
    }

}

const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer
    return {
        Loading: !State.ProListLoad,
        ProInfo: State.proInfo,
        examID: State.examId
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    JumpToPro: (ProIndex: number) => dispatch({
        type: "updateTop",
        topIndex: ProIndex
    }),
    GetProList: (eid: examID) => dispatch(getExamProblemListTodo())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamAnswerSheet)
    ))