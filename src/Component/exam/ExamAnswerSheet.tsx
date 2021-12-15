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
import {getAnswerSheetTodo, getExamProblemListTodo} from "../../Redux/Action/exam";


class ExamAnswerSheet extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    componentDidMount() {
        if (this.props.ProGroupInfo == undefined)
            this.props.GetProList(this.props.match.params.eid)
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any) {
        if (prevProps.Loading && !this.props.Loading) {
            const groupInfo: SProGroupInfo[] = this.props.ProGroupInfo
            for(const x of groupInfo){
                if(x.type == "SingleChoice" || x.type == "MultipleChoice"){
                    this.props.getAnswerSheet(this.props.match.params.eid, x.index)
                }
            }
        }
    }

    render() {

        return (
            <div className={"ExamAnswerSheet"}>
                <Card>
                    <Meta className={"ExamAnswerSheetMeta"}
                          title={this.props.t("AnswerSheet")}
                          description={
                              <>
                                  <div style={{margin: "0 auto", textAlign: "center"}}>
                                      <Space size={30}>
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
                                                      <ProTagGroup groupInfo={Value}/>
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
        ProGroupInfo: State.proGroupInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({
    GetProList: (eid: examID) => dispatch(getExamProblemListTodo(eid)),
    getAnswerSheet: (eid: examID, groupId: number) => dispatch(getAnswerSheetTodo(eid, groupId)),

})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamAnswerSheet)
    ))