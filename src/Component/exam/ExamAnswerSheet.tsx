import React, {Component, Dispatch} from "react";
import {Card, Col, Row, Skeleton, Space} from "antd";
import Meta from "antd/lib/card/Meta";
import ProTagGroup from "./ProTagGroup";
import ProTag from "./ProTag";
import {ExamState} from "../../Redux/Reducer/exam";
import {ExamAction} from "../../Redux/Action/exam";
import {connect} from "react-redux";
import {ProNameMap} from "../../Type/IProblem";
import {withTranslation} from "react-i18next";


class ExamAnswerSheet extends Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
    }

    render() {
        let ProList: { "title": string, "proList": number[] }[] = []
        if (!this.props.Loading) {
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
            this.props.GetProList()
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
                                          <ProTag ProIndex={0} ProURL={""} TagState={["d"]} exp={this.props.t("Unanswered")}/>
                                          <ProTag ProIndex={0} ProURL={""} TagState={["f"]} exp={this.props.t("Answered")}/>
                                          <ProTag ProIndex={0} ProURL={""} TagState={["c", "d"]} exp={this.props.t("Marked")}/>
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
        ProInfo: State.proInfo
    }
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({
    JumpToPro: (ProIndex: number) => dispatch({
        type: "updateTop",
        topIndex: ProIndex
    }),
    GetProList: () => dispatch({
        type: "GetProList"
    })
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(ExamAnswerSheet))