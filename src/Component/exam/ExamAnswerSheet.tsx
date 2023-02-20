import React, {Dispatch} from "react";
import {Card, Space} from "antd";
import Meta from "antd/lib/card/Meta";
import ProTagGroup from "./ProTagGroup";
import ProTag from "./ProTag";
import {connect, useSelector} from "react-redux";
import {withTranslation} from "react-i18next";
import {withRouter} from "react-router";


const ExamAnswerSheet = (props: any) => {


    const eid = props.match.params.eid
    // const gid = props.match.params.gid
    // const pid = props.match.params.pid


    const problemList = useSelector((state: any) => {
        return state.ExamReducer.examProListInfo[eid]
    })

    return (
        <div className={"ExamAnswerSheet"}>
            <Card>
                <Meta className={"ExamAnswerSheetMeta"}
                      title={props.t("AnswerSheet")}
                      description={
                          <>
                              <div style={{margin: "0 auto", textAlign: "center"}}>
                                  <Space size={30}>
                                      <ProTag empty={true} exp={props.t("Unanswered")}/>
                                      <ProTag empty={true} color={"green"} exp={props.t("Answered")}/>
                                      <ProTag empty={true} useDot={true} exp={props.t("Marked")}/>
                                  </Space>
                              </div>
                              {problemList !== undefined && (
                                  Object.keys(problemList).map((v: any) => {
                                      return (
                                          <ProTagGroup gid={problemList[v].index}/>
                                      )
                                  })
                              )}
                          </>
                      }
                />
            </Card>
        </div>
    )

}

const mapStateToProps = (state: any) => {
    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<any>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    withTranslation()(
        withRouter(ExamAnswerSheet)
    ))
