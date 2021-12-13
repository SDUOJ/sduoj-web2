import React, {Component, Dispatch} from "react";
import {Card, Skeleton, Space} from "antd";
import Meta from "antd/lib/card/Meta";
import ProTagGroup from "./ProTagGroup";
import ProTag from "./ProTag";
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import {ExamState, SProGroupInfo} from "../../Type/IExam";
import {examID} from "../../Type/types";
import {withRouter} from "react-router";
import {getExamProblemListTodo} from "../../Redux/Action/exam";


class ExamAnswerSheet extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        console.log("AnswerSheet", this.props.match.params.eid)
        this.props.GetProList(this.props.match.params.eid)
    }

    render() {
        let ProList: { "title": string, "proList": number[] }[] = []

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

                                          this.props.ProGroupInfo != undefined && (
                                              this.props.ProGroupInfo.map((Value: SProGroupInfo) => {
                                                  return (
                                                      <ProTagGroup title={Value.title} proList={Value.proList}/>
                                                  )
                                              })
                                          )
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
        examID: State.examId,
        ProGroupInfo: State.proGroupInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    JumpToPro: (ProIndex: number) => dispatch({
        type: "updateTop",
        topIndex: ProIndex
    }),
    GetProList: (eid: examID) => dispatch(getExamProblemListTodo(eid))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamAnswerSheet)
    ))