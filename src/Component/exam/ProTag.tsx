import React, {Component, Dispatch} from "react";
import {Badge, Popover, Progress, Space, Tag} from "antd";
import {ExamAction} from "../../Redux/Action/exam";
import {connect, useSelector} from "react-redux";
import {isProgramContent} from "../../Type/IProblem";
import {withTranslation} from "react-i18next";
import {ExamState, SProInfo} from "../../Type/IExam";
import {withRouter} from "react-router-dom";
import {isValueEmpty} from "../../Utils/empty";


const ProTag = (props: any) => {

    const eid = props.match.params.eid
    const nowGid = parseInt(props.match.params.gid)
    const nowPid = parseInt(props.match.params.pid)
    const pid = props.pid, gid = props.gid

    const answerSheet = useSelector((state: any) => {
        if (!isValueEmpty(state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`]))
            return state.ExamReducer.examAnswerSheetInfo[`${eid}_${gid}`][pid]
        return undefined
    })

    return (
        <div className={"tag-div"}>
            <Space>
                <a className={"ProTag"}
                   onClick={props.empty ? undefined : () => {
                       props.history.push(`/v2/exam/running/${eid}/${gid}/${pid}`)
                   }}
                >
                    <Badge dot={props.useDot ?? answerSheet?.marked}>
                        <Tag
                            color={(props.color ?? ((answerSheet === undefined || answerSheet?.answer?.length === 0) ? undefined : "green"))}>
                            {(() => {
                                if (props.empty) return (<>&nbsp;&nbsp;</>)
                                else return <>{pid + 1}</>
                            })()}
                        </Tag>
                    </Badge>
                </a>
                {props.empty && (
                    <span style={{color: "black", marginLeft: "-10px"}}>{props.exp}</span>
                )}
            </Space>
            {nowGid === gid && nowPid === pid && (
                <div className={"nowPro"}/>
            )}
        </div>
    )

}


const mapStateToProps = (state: any) => {
    const State: ExamState = state.ExamReducer

    return {}
}

const mapDispatchToProps = (dispatch: Dispatch<ExamAction>) => ({})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withTranslation()(withRouter(ProTag)))